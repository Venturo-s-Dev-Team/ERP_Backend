require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { mainDb } = require('./modules/knexfile'); // Configurações do Knex 
const { createEmpresaKnexConnection } = require('./modules/MultiSchemas') // Configurações da conexão dinâmica com o banco da empresa
const { checkIfDatabaseExists } = require('./modules/CheckIfDatabaseExists') // Verifica se tem um banco de dados existente
const { copyDatabase } = require('./modules/CopyDatabase'); // Copia o banco de dados
const { createConnection } = require('./modules/CreateConnectionMultipleStatements'); // Cria uma conexxão sql MultipleStatements = true
const { logAction } = require('./modules/LogAction'); // Função de Logs
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path')
const fs = require('fs');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
  origin: `${process.env.IP_FRONT_END}`, // Permitir o IP do front-end
  credentials: true
}));

// Servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/Logo', express.static(path.join(__dirname, 'Logo')));

// LOGIN - CADASTRO - LOGOUT

// Rota para login
app.post('/login', async (req, res) => {
  const { Nome, Senha } = req.body; // Obtendo id, Nome e Senha do corpo da requisição.

  try {
    // Busca usuário/SuperAdministrador pelo ID e Nome no Database* principal
    const user = await mainDb('admin_users').where({ Nome }).first();

    if (user) {
      // Verifica a senha criptografada* do usuário com o bcrypt.
      const isPasswordValid = await bcrypt.compare(Senha, user.Senha);
      if (isPasswordValid) {
        // Gera o token JWT se a senha for válida.
        const token = jwt.sign(
          { id_user: user.id, Nome_user: user.Nome, Email: user.email, TypeUser: user.TypeUser, isUser: true },
          process.env.JWT_SECRET,
          { expiresIn: '1h' } // Token expira em 1 hora.
        );
        // Registra log de login bem-sucedido
        await logAction(user.id, user.Nome, 'Login', 'admin_users');
        // Configura o cookie com o token JWT.
        res.cookie('jwt_token', token, { httpOnly: true, secure: false });
        res.status(200).send({ token }); // Token é enviado para o front-end
      } else {
        res.status(401).send('Credenciais inválidas'); // Senha inválida.
      }
    } else {
      // Busca empresa pelo ID e Nome no * principal
      const empresa = await mainDb('cadastro_empresarial').where({ Gestor: Nome }).first();

      if (empresa) {
        // Verifica a senha * da empresa com bcrypt.
        const isPasswordValid2 = await bcrypt.compare(Senha, empresa.Senha);
        if (isPasswordValid2) {
          if (empresa.Autorizado === "NO") {
            res.status(403).send('Empresa não autorizada'); // Empresa não autorizada para efetuar login
          } else {
            // Gera o token JWT se a senha for válida.
            const token = jwt.sign(
              { ID_Empresa: empresa.id, Gestor: empresa.Gestor, Empresa: empresa.Empresa, Logo: empresa.Logo, Email: empresa.email },
              process.env.JWT_SECRET,
              { expiresIn: '1h' } // Token expira em 1 hora.
            );
            // Configura o cookie com o token JWT.
            res.cookie('jwt_token', token, { httpOnly: true, secure: false });
            // Registra log de login bem-sucedido
            await logAction(empresa.id, empresa.Gestor, 'Login', 'cadastro_empresarial');
            // Conectar ao banco de dados da empresa específica.
            const empresaDb = createEmpresaKnexConnection(empresa.id);
            req.empresaDb = empresaDb;

            res.status(200).send({ token }); // Envia o token para o front-end
          }
        } else {
          res.status(401).send('Credenciais inválidas'); // Senha inválida.
        }
      } else {
        // Caso não seja administrador nem empresa, verificar em todas as empresas para funcionários.
        const empresas = await mainDb('cadastro_empresarial').select('id'); // Seleciona todos os id da tabela do * principal
        let funcionario;
        let empresaId;

        for (const empresa of empresas) {
          const databaseName = `empresa_${empresa.id}`;

          // Verifica se o banco de dados da empresa está ativo e existe
          const databaseExists = await checkIfDatabaseExists(databaseName);

          if (!databaseExists) {
            res.status(403).send('Empresa não autorizada');
            return;
          }

          const tableName = `${databaseName}.Funcionario`;
          funcionario = await mainDb(tableName).where({ Nome }).first();

          if (funcionario) {
            empresaId = empresa.id;
            break;
          }
        }

        if (funcionario) {
          // Verifica a senha do funcionário.
          const isPasswordValid = await bcrypt.compare(Senha, funcionario.Senha);
          if (isPasswordValid) {
            // Gera o token JWT se a senha for válida.
            const token = jwt.sign(
              { id_user: funcionario.id, id_EmpresaDb: funcionario.Empresa, Nome_user: funcionario.Nome, TypeUser: funcionario.TypeUser, isUser: true },
              process.env.JWT_SECRET,
              { expiresIn: '1h' } // Token expira em 1 hora.
            );
            // Registra log de login bem-sucedido
            await logAction(funcionario.id, funcionario.Nome, 'Login', `Funcionario => empresa_${funcionario.Empresa}`);
            // Configura o cookie com o token JWT.
            res.cookie('jwt_token', token, { httpOnly: true, secure: false });
            res.status(200).send({ token }); // Envia o token para o front-end
          } else {
            res.status(401).send('Credenciais inválidas'); // Senha inválida.
          }
        } else {
          res.status(401).send('Credenciais inválidas'); // Usuário não encontrado.
        }
      }
    }
  } catch (err) {
    console.error("Erro ao fazer login:", err); // Log detalhado.
    res.status(500).send("Não foi possível fazer a requisição");
  }
});


// Registro de empresas
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/Logo');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/registro', upload.single('logo'), async (req, res) => {
  const { empresa, cnpj, gestor, email, senha } = req.body;

  try {
    let logoFilename = null;
    if (req.file) {
      logoFilename = req.file.filename;
    }

    const existingCompanyByName = await mainDb('cadastro_empresarial').where({ Empresa: empresa }).first();
    if (existingCompanyByName) {
      return res.status(409).send({ errorCode: 409, message: "Empresa já registrada" });
    }

    const existingCompanyByCnpj = await mainDb('cadastro_empresarial').where({ CNPJ: cnpj }).first();
    if (existingCompanyByCnpj) {
      return res.status(409).send({ errorCode: 409, message: "CNPJ já registrado" });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    const [createdCompanyId] = await mainDb('cadastro_empresarial').insert({
      Empresa: empresa,
      CNPJ: cnpj,
      Gestor: gestor,
      Logo: logoFilename,
      email: email,
      Senha: hashedSenha
    });

    res.sendStatus(200);
    console.log('Cadastrado com sucesso: ', createdCompanyId);
  } catch (err) {
    console.log('Erro ao registrar empresa:', err);
    return res.status(500).send({ errorCode: 500, message: "Não foi possível fazer o registro" });
  }
});

app.get('/logout', async (req, res) => {
  // Obtendo informações do usuário do token (exemplo)
  const token = req.cookies.jwt_token;
  const { id_user, Nome_user } = jwt.verify(token, process.env.JWT_SECRET);

  // Limpar o token JWT do cliente
  res.clearCookie('jwt_token');
  console.log('Usuário desconectado');

  // Registra log de logout
  await logAction(id_user, Nome_user, 'Logout', '---');

  res.sendStatus(200);
});


// POST

//E-mail
app.post('/email', async (req, res) => {
  const { Remetente, Destinatario, Assunto, Mensagem } = req.body

  try {
    const email = await mainDb('mensagens').insert({
      Remetente, Destinatario, Assunto, Mensagem
    })

    if (email) {
      res.send(200)
      console.log ('E-mail enviado: ', email);
    }
  } catch (err) {
    res.send(500)
    console.log('Erro: ', err)
  }
})

// GET

//Sugestão de e-mails próximos com enviado
app.get('/email_suggestions', async (req, res) => {
  const { query } = req.query;

  try {
      // Execute both queries simultaneously
      const [adminUsers, cadastroEmpresarial] = await Promise.all([
          mainDb('admin_users').where('email', 'like', `%${query}%`).select('email').limit(5),
          mainDb('cadastro_empresarial').where('email', 'like', `%${query}%`).select('email').limit(5)
      ]);

      // Combine and deduplicate the results
      const suggestions = [...adminUsers, ...cadastroEmpresarial];
      const uniqueEmails = [...new Set(suggestions.map(suggestion => suggestion.email))];

      res.status(200).json(uniqueEmails);
  } catch (err) {
      console.error('Erro ao buscar sugestões de e-mail', err);
      res.status(500).send('Erro no servidor');
  }
});

// Informações das empresas
app.get('/SelectInfoEmpresa/:id', async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  try {
    const SelectInfo = await mainDb('cadastro_empresarial').where({ id: parseInt(id) })
    if (SelectInfo) {
      res.status(200).send({ InfoEmpresa: SelectInfo })
    } else {
      res.status(500)
    }
  } catch (error) {
    console.log('Erro ao coletar dados: ', error);
    res.status(500)
  }
})

// E-mails
app.get('/caixa_entrada', async (req, res) => {
  const token = req.cookies.jwt_token;
  const { Email } = jwt.verify(token, process.env.JWT_SECRET);

  try {
    const Emails = await mainDb('mensagens').where('Destinatario', Email).select('*');
    if (Emails.length > 0) {
      res.status(200).json(Emails);
      console.log('Caixa de Entrada: ', Emails);
    } else {
      res.status(204).send('Não há mensagens para você');
      console.log('Não há mensagens para você');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor ', err);
  }
});

app.get('/caixa_saida', async (req, res) => {
  const token = req.cookies.jwt_token;
  const { Email } = jwt.verify(token, process.env.JWT_SECRET);

  try {
    const Emails = await mainDb('mensagens').where('Remetente', Email).select('*');
    if (Emails.length > 0) {
      res.status(200).json(Emails);
      console.log('Caixa de Saida: ', Emails);
    } else {
      res.status(204).send('Não há mensagens para você');
      console.log('Não há mensagens para você');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor: ', err);
  }
});



// TABELAS

// Rota para tabelas de super administradores
app.get('/tableSuperAdmins', async (req, res) => {
  try {
    const project_Users_Admin = await mainDb('admin_users').select();
    res.status(200).send({ DadosTabela: project_Users_Admin });
  } catch (err) {
    console.error('Erro ao carregar tabela:', err);
    res.status(500).send({ message: "Não foi possível fazer a requisição das informações" });
  }
});

// Rota para tabelas de empresas
app.get('/tableEmpresas', async (req, res) => {
  try {
    const project_CNPJ_Registers = await mainDb('cadastro_empresarial').select();
    res.status(200).send({ InfoTabela: project_CNPJ_Registers });
  } catch (err) {
    console.log('Erro ao carregar tabela', err);
    return res.status(500).send({ errorCode: 500, message: "Não foi possível fazer a requisição das informações" });
  }
});

// TABLES --- EMPRESAS

// Rota para obter informações da tabela Estoque
app.get(`/tableEstoque/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(id);
    const estoqueInfo = await knexInstance('Estoque').select('*');
    res.status(200).send({ InfoTabela: estoqueInfo });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

app.get('/tableFuncionario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const knexInstance = createEmpresaKnexConnection(id);
    const funcionarioInfo = await knexInstance('Funcionario').select('*');
    res.status(200).send({ InfoTabela: funcionarioInfo });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Funcionário' });
  }
})

// UPDATES

app.get('/autorizar/:id', async (req, res) => {
  const { id } = req.params;
  // Obtendo informações do usuário do token (exemplo)
  const token = req.cookies.jwt_token;
  const { id_user, Nome_user } = jwt.verify(token, process.env.JWT_SECRET);

  try {
    // Atualiza o registro da empresa para autorizado
    const updatedRegister = await mainDb('cadastro_empresarial').where({ id: parseInt(id) }).update({ Autorizado: 'YES' });

    const dbName = `empresa_${id}`;
    const inactiveDbName = `inactive_empresa_${id}`;

    // Cria uma conexão com o MySQL usando o módulo separado
    const connection = await createConnection();

    const [rows] = await connection.query(`SHOW DATABASES LIKE '${inactiveDbName}'`);

    if (rows.length > 0) {
      // Se o banco de dados inativo existe, reativa-o copiando para um novo banco de dados
      await connection.query(`CREATE DATABASE ${dbName}`);
      await copyDatabase(connection, inactiveDbName, dbName);
      await connection.query(`DROP DATABASE ${inactiveDbName}`);
      console.log(`Banco de dados reativado: ${dbName}`);
    } else {
      // Se o banco de dados inativo não existe, cria um novo banco de dados com as tabelas necessárias
      const createDatabaseAndTables = `
        CREATE DATABASE IF NOT EXISTS ${dbName};
        USE ${dbName};

        CREATE TABLE IF NOT EXISTS Funcionario (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Nome VARCHAR(255) NOT NULL,
          Senha VARCHAR(255),
          TypeUser VARCHAR(50),
          DataInserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
          Empresa INT(11) DEFAULT '${id}'
        );
        
        CREATE TABLE Ativos (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          Valor DECIMAL(15, 2) NOT NULL
        );

        CREATE TABLE Passivos (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          Valor DECIMAL(15, 2) NOT NULL
        );

        CREATE TABLE Receita (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          Valor DECIMAL(15, 2) NOT NULL
        );

        CREATE TABLE Despesas (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          Valor DECIMAL(15, 2) NOT NULL
        );

        CREATE TABLE NotaFiscal (
          Numero INT PRIMARY KEY,
          Serie VARCHAR(50) NOT NULL,
          DataEmissao DATE NOT NULL,
          FornecedorOuCliente VARCHAR(255) NOT NULL
        );

        CREATE TABLE Endereco (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Logradouro VARCHAR(255) NOT NULL,
          Cidade VARCHAR(255) NOT NULL,
          Estado VARCHAR(50) NOT NULL,
          Bairro VARCHAR(255) NOT NULL,
          Rua VARCHAR(255) NOT NULL,
          Numero VARCHAR(10) NOT NULL,
          CEP VARCHAR(9) NOT NULL
        );

        CREATE TABLE Cliente (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          CPF_CNPJ VARCHAR(20) NOT NULL UNIQUE,
          Enderecoid INT,
          FOREIGN KEY (Enderecoid) REFERENCES Endereco(id)
        );

        CREATE TABLE Fornecedor (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          CNPJ VARCHAR(18) NOT NULL UNIQUE,
          Enderecoid INT,
          FOREIGN KEY (Enderecoid) REFERENCES Endereco(id)
        );

        CREATE TABLE Estoque (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          Codigo VARCHAR(50) NOT NULL UNIQUE,
          Quantidade INT NOT NULL,
          ValorUnitario DECIMAL(15, 2) NOT NULL,
          Estoque VARCHAR(100)
        );
      `;
      await connection.query(createDatabaseAndTables);
    }

    await connection.end();

    // Registra log de logout
    await logAction(id_user, Nome_user, `Autorizou Empresa_${id}`, `cadastro_empresarial and DB empresa_${id}`);

    res.status(200).send('Empresa autorizada e banco de dados configurado.');
  } catch (err) {
    console.error("Erro ao autorizar empresa:", err); // Log detalhado
    res.status(500).send("Não foi possível fazer a requisição");
  }
});


app.get('/desautorizar/:id', async (req, res) => {
  const { id } = req.params;
  // Obtendo informações do usuário do token (exemplo)
  const token = req.cookies.jwt_token;
  const { id_user, Nome_user } = jwt.verify(token, process.env.JWT_SECRET);

  try {
    // Atualiza o registro da empresa para não autorizado
    const updatedRegister = await mainDb('cadastro_empresarial').where({ id: parseInt(id) }).update({ Autorizado: 'NO' });

    const dbName = `empresa_${id}`;
    const inactiveDbName = `inactive_empresa_${id}`;

    // Cria uma conexão com o MySQL usando o módulo separado
    const connection = await createConnection();

    const [rows] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);

    if (rows.length > 0) {
      // Se o banco de dados ativo existe, inativa-o copiando para um banco de dados inativo
      await connection.query(`CREATE DATABASE ${inactiveDbName}`);
      await copyDatabase(connection, dbName, inactiveDbName);
      await connection.query(`DROP DATABASE ${dbName}`);
      console.log(`Banco de dados inativado: ${dbName}`);
    }

    await connection.end();

    // Registra log de logout
    await logAction(id_user, Nome_user, `Desautorizou Empresa_${id}`, `cadastro_empresarial and DB empresa_${id}`);

    res.status(200).send('Empresa desautorizada e banco de dados inativado.');
  } catch (err) {
    console.error("Erro ao desautorizar empresa:", err); // Log detalhado
    res.status(500).send("Não foi possível fazer a requisição");
  }
});


app.listen(3001, () => {
  console.log('API listening on port 3001');
});
