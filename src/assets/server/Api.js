require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { mainDb } = require('./modules/KnexJS/knexfile'); // Configurações do Knex 
const { createEmpresaKnexConnection } = require('./modules/KnexJS/MultiSchemas') // Configurações da conexão dinâmica com o banco da empresa
const { checkIfDatabaseExists } = require('./modules/Functions/MYSQL/CheckIfDatabaseExists') // Verifica se tem um banco de dados existente
const { copyDatabase } = require('./modules/Functions/MYSQL/CopyDatabase'); // Copia o banco de dados
const { createConnection } = require('./modules/KnexJS/CreateConnectionMultipleStatements'); // Cria uma conexxão sql MultipleStatements = true
const { logAction } = require('./modules/Functions/LOGS/LogAction_db'); // Função de Logs
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const { logActionEmpresa } = require('./modules/Functions/LOGS/LogAction_db_empresas');

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
    // Busca usuário/SuperAdministrador pelo Nome no banco principal
    const user = await mainDb('admin_users').where({ Nome }).first();

    if (user) {
      // Verifica a senha criptografada do usuário com o bcrypt.
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
      // Busca empresa pelo Nome no banco principal
      const empresa = await mainDb('cadastro_empresarial').where({ Gestor: Nome }).first();

      if (empresa) {
        // Verifica a senha da empresa com bcrypt.
        const isPasswordValid2 = await bcrypt.compare(Senha, empresa.Senha);
        if (isPasswordValid2) {
          if (empresa.Autorizado === "NO") {
            res.status(403).send('Empresa não autorizada'); // Empresa não autorizada para efetuar login
          } else {
            // Gera o token JWT se a senha for válida.
            const token = jwt.sign(
              { id_user: empresa.id, Nome_user: empresa.Gestor, Empresa: empresa.Empresa, Logo: empresa.Logo, Email: empresa.email },
              process.env.JWT_SECRET,
              { expiresIn: '1h' } // Token expira em 1 hora.
            );
            // Configura o cookie com o token JWT.
            res.cookie('jwt_token', token, { httpOnly: true, secure: false });
            // Registra log de login bem-sucedido
            await logAction(empresa.id, empresa.Gestor, 'Login', 'cadastro_empresarial');
            await logActionEmpresa(empresa.id, empresa.id, empresa.Gestor, 'Login', 'erp.cadastro_empresarial')
            // Conectar ao banco de dados da empresa específica.
            const empresaDb = createEmpresaKnexConnection(`empresa_${empresa.id}`);
            req.empresaDb = empresaDb;
            res.status(200).send({ token }); // Envia o token para o front-end
          }
        } else {
          res.status(401).send('Credenciais inválidas'); // Senha inválida.
        }
      } else {
        // Caso não seja administrador nem empresa, verificar em todas as empresas para funcionários.
        const empresas = await mainDb('cadastro_empresarial').select('id'); // Seleciona todos os id da tabela do banco principal
        let funcionario;
        let empresaId;

        for (const empresa of empresas) {
          const databaseName = `empresa_${empresa.id}`;
          console.log(databaseName);

          // Verifica se o banco de dados da empresa está ativo e existe
          const databaseExists = await checkIfDatabaseExists(databaseName);

          if (!databaseExists) {
            continue; // Continue para o próximo banco de dados se o atual não existir
          }

          const empresaDb = createEmpresaKnexConnection(databaseName);
          const tableName = 'Funcionario'; // Nome da tabela no banco da empresa
          funcionario = await empresaDb(tableName).where({ Nome }).first();

          if (funcionario) {
            empresaId = empresa.id;
            break; // Sai do loop se o funcionário for encontrado
          }
        }

        if (funcionario) {
          // Verifica a senha do funcionário.
          const isPasswordValid = await bcrypt.compare(Senha, funcionario.Senha);
          if (isPasswordValid) {
            // Gera o token JWT se a senha for válida.
            const token = jwt.sign(
              { id_user: funcionario.id, id_EmpresaDb: funcionario.Empresa, Nome_user: funcionario.Nome, Email: funcionario.email, TypeUser: funcionario.TypeUser, isUser: true },
              process.env.JWT_SECRET,
              { expiresIn: '1h' } // Token expira em 1 hora.
            );
            // Registra log de login bem-sucedido
            await logActionEmpresa(funcionario.Empresa, funcionario.id, funcionario.Nome, 'Login', 'Funcionario')
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
    }).returning('id'); // Supondo que 'id' é o nome da coluna do ID

    if (logoFilename) {
      const newLogoFilename = `${createdCompanyId}${path.extname(logoFilename)}`;
      const oldPath = path.join('uploads/Logo', logoFilename);
      const newPath = path.join('uploads/Logo', newLogoFilename);

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.error('Erro ao renomear o arquivo:', err);
          return res.status(500).send({ errorCode: 500, message: "Não foi possível renomear o arquivo da logo" });
        }

        // Atualiza o nome do arquivo no banco de dados
        mainDb('cadastro_empresarial')
          .where({ id: createdCompanyId })
          .update({ Logo: newLogoFilename })
          .then(() => {
            res.sendStatus(200);
            console.log('Cadastrado com sucesso empresa: ', createdCompanyId);
          })
          .catch(updateErr => {
            console.error('Erro ao atualizar o nome do arquivo no banco de dados:', updateErr);
            res.status(500).send({ errorCode: 500, message: "Não foi possível atualizar o nome do arquivo no banco de dados" });
          });
      });
    } else {
      res.sendStatus(200);
      console.log('Cadastrado com sucesso: ', createdCompanyId);
    }
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

// Configuração do multer para salvar arquivos na pasta 'uploads/Docs'
const storageDocs = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/Docs');
  },
  filename: function (req, file, cb) {
    // Usa o nome original do arquivo
    cb(null, file.originalname);
  }
});

const uploadDocs = multer({ storage: storageDocs });

// Rota para enviar e-mails com arquivo anexado
app.post('/email', uploadDocs.single('anexo'), async (req, res) => {
  const { Remetente, Destinatario, Assunto, Mensagem } = req.body;
  const arquivo = req.file; // Obtenha o arquivo do `req.file` gerado pelo multer

  try {
    // Verifique se o arquivo foi enviado e obtenha o caminho
    let caminhoArquivo = null;
    if (arquivo) {
      caminhoArquivo = arquivo.path; // Salva o caminho relativo do arquivo
    }

    // Insira os dados da mensagem no banco de dados
    const [emailId] = await mainDb('mensagens').insert({
      Remetente,
      Destinatario,
      Assunto,
      Mensagem,
      Arquivo: caminhoArquivo // Armazena o caminho do arquivo no banco de dados
    }).returning('id'); // Supondo que 'id' é o nome da coluna do ID

    if (emailId) {
      res.status(200).json({ message: 'E-mail enviado com sucesso!', id: emailId });
      console.log('E-mail enviado: ', emailId);
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar o e-mail' });
    console.log('Erro: ', err);
  }
});

// POST - EMPRESAS

//ESTOQUE
app.post(`/tableEstoque/:id`, async (req, res) => {
  const { Nome, Codigo , Quantidade, ValorUnitario, Estoque } = req.body;
  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('Estoque').insert({
      Nome,
      Codigo,
      Quantidade,
      ValorUnitario,
      Estoque,
    });
    res.status(201).send({ id: newId, message: 'Produto adicionado com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar produto na tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao adicionar produto na tabela Estoque' });
  }
});

//CLIENTES
app.post(`/tableCliente/:id`, async (req, res) => {
  const { Nome, CPF_CNPJ , Enderecoid } = req.body;
  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('Cliente').insert({
      Nome,
      CPF_CNPJ,
      Enderecoid,
    });
    res.status(201).send({ id: newId, message: 'Cliente registrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar Cliente na tabela Clientes:', error);
    res.status(500).send({ message: 'Erro ao adicionar Cliente na tabela Clientes' });
  }
});

//FORNECEDORES
app.post(`/tableFornecedor/:id`, async (req, res) => {
  const { Nome, CPF_CNPJ , Enderecoid } = req.body;
  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('Fornecedor').insert({
      Nome,
      CPF_CNPJ,
      Enderecoid,
    });
    res.status(201).send({ id: newId, message: 'Fornecedor registrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar Fornecedor na tabela Fornecedor:', error);
    res.status(500).send({ message: 'Erro ao adicionar For na tabela Clientes' });
  }
});

//DELETE

// DELETE - EMPRESAS

//ESTOQUE
app.delete(`/tableEstoque/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { produtoId } = req.body; 

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('Estoque').where({ id: produtoId }).del();

    if (rowsDeleted) {
      res.status(200).send({ message: 'Produto deletado com sucesso!' });
    } else {
      res.status(404).send({ message: 'Produto não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar produto da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao deletar produto da tabela Estoque' });
  }
});

//CLIENTES
app.delete(`/tableCliente/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { ClienteId } = req.body; 

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('Cliente').where({ id: ClienteId }).del();

    if (rowsDeleted) {
      res.status(200).send({ message: 'Cliente deletado com sucesso!' });
    } else {
      res.status(404).send({ message: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar Cliente da tabela Cliente:', error);
    res.status(500).send({ message: 'Erro ao deletar Cliente da tabela Cliente' });
  }
});

//FORNECEDORES
app.delete(`/tableFornecedor/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { FornecedorId } = req.body; 

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('Fornecedor').where({ id: FornecedorId }).del();

    if (rowsDeleted) {
      res.status(200).send({ message: 'Fornecedor deletado com sucesso!' });
    } else {
      res.status(404).send({ message: 'Fornecedor não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar Fornecedor da tabela Fornecedor:', error);
    res.status(500).send({ message: 'Erro ao deletar Fornecedor da tabela Fornecedor' });
  }
});


// GET

app.get('/email_suggestions', async (req, res) => {
  const { query } = req.query;

  try {
    // Executa ambas requisições simultaneamente no mainDb
    const [adminUsers, cadastroEmpresarial] = await Promise.all([
      mainDb('admin_users').where('email', 'like', `%${query}%`).select('email').limit(5),
      mainDb('cadastro_empresarial').where('email', 'like', `%${query}%`).select('email').limit(5)
    ]);

    // Combina os resultados do mainDb
    let suggestions = [...adminUsers, ...cadastroEmpresarial];

    // E os seus status de autorização
    const empresas = await mainDb('cadastro_empresarial').select('id', 'Autorizado');

    // Função para requerir o e-mail de um database específico
    const getEmployeeEmails = async (id, autorizado) => {
      const databaseName = autorizado === "NO" ? `inactive_empresa_${id}` : `empresa_${id}`;
      const empresaDb = createEmpresaKnexConnection(databaseName); // Creates a dynamic connection
      try {
        return await empresaDb('Funcionario').where('email', 'like', `%${query}%`).select('email').limit(5);
      } catch (err) {
        // Se houver um erro (EX.: unknow database [...]), haverá um log
        console.error(`Erro ao acessar o banco de dados da empresa ${id}:`, err);
        return []; // Retorna uma matriz limpa ou erro
      }
    };

    // Pega todos os e-mails de todos database encontrados de forma simultânea
    const employeeEmailPromises = empresas.map(({ id, Autorizado }) => getEmployeeEmails(id, Autorizado));
    const employeeEmailsArray = await Promise.all(employeeEmailPromises);

    // Combina os resultados encontrados
    employeeEmailsArray.forEach(employeeEmails => {
      suggestions = [...suggestions, ...employeeEmails];
    });

    // Remove e-mails duplicados do resultado
    const uniqueEmails = [...new Set(suggestions.map(suggestion => suggestion.email))];

    // Se nenhum e-mail for encontrado
    if (uniqueEmails.length === 0) {
      res.status(404).json({ message: "Esse e-mail não foi encontrado" });
    } else {
      res.status(200).json(uniqueEmails);
    }
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
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
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
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
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
    await mainDb('cadastro_empresarial').where({ id: parseInt(id) }).update({ Autorizado: 'YES' });

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
          email varchar(255) NOT NULL,
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

        CREATE TABLE historico_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id int(11) NOT NULL,
          user_name varchar(255) NOT NULL,
          action varchar(255) NOT NULL,
          table_name varchar(255) NOT NULL,
          timestamp datetime DEFAULT current_timestamp()
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
    await mainDb('cadastro_empresarial').where({ id: parseInt(id) }).update({ Autorizado: 'NO' });

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

//UPDATE - EMPRESAS 

//ESTOQUE
app.post(`/tableEstoque/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, Codigo, Quantidade, ValorUnitario, Estoque } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('Estoque').insert({
      Nome,
      Codigo,
      Quantidade,
      ValorUnitario,
      Estoque
    });
    res.status(201).send({ id: newId, message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar produto na tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao atualizar produto na tabela Estoque' });
  }
});

//CLIENTES
app.post(`/tableCliente/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, CPF_CNPJ, Enderecoid } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('Cliente').insert({
      Nome,
      CPF_CNPJ,
      Enderecoid,
    });
    res.status(201).send({ id: newId, message: 'Cliente atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar Cliente na tabela Cliente:', error);
    res.status(500).send({ message: 'Erro ao atualizar Cliente na tabela Cliente' });
  }
});

//FORNECEDORES
app.post(`/tableFornecedor/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, CNPJ, Enderecoid } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('Fornecedor').insert({
      Nome,
      CNPJ,
      Enderecoid,
    });
    res.status(201).send({ id: newId, message: 'Fornecedor atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar Fornecedor na tabela Fornecedor:', error);
    res.status(500).send({ message: 'Erro ao atualizar Fornecedor na tabela Fornecedor' });
  }
});

app.listen(3001, () => {
  console.log('API listening on port 3001');
});
