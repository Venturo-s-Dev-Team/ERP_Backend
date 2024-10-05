require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { mainDb } = require('./modules/KnexJS/knexfile'); // Configurações do Knex 
const { createEmpresaKnexConnection } = require('./modules/KnexJS/MultiSchemas') // Configurações da conexão dinâmica com o banco da empresa
const { checkIfDatabaseExists } = require('./modules/middleware/MYSQL/CheckIfDatabaseExists') // Verifica se tem um banco de dados existente
const { copyDatabase } = require('./modules/Functions/MYSQL/CopyDatabase'); // Copia o banco de dados
const { createConnection } = require('./modules/KnexJS/CreateConnectionMultipleStatements'); // Cria uma conexxão sql MultipleStatements = true
const { verifyToken } = require('./modules/middleware/Auth/JWT/VerifyToken')
const { logAction } = require('./modules/Functions/LOGS/LogAction_db'); // Função de Logs
const { logActionEmpresa } = require('./modules/Functions/LOGS/LogAction_db_empresas');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs')

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
app.use('/uploads/ProdutosIMG', express.static(path.join(__dirname, 'ProdutosIMG')));

// LOGIN - JWT - CADASTRO_EMPRESARIAL - LOGOUT

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
                    { id_user: user.id, Nome_user: user.Nome, Email: user.email, TypeUser: user.TypeUser, },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' } // Token expira em 15 minutos.
                );

                // Gera o refresh token.
                const refreshToken = jwt.sign(
                    { id_user: user.id, Nome_user: user.Nome, Type: 'Main', },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: '7d' } // Refresh token expira em 7 dias.
                );

                // Registra log de login bem-sucedido
                await logAction(user.id, user.Nome, 'Login', 'admin_users');
                // Configura o cookie com o token JWT.
                res.cookie('jwt_token', token, { httpOnly: true, secure: false });
                res.cookie('rt_jwt_token', refreshToken, { httpOnly: true, secure: false });
                res.status(200).send({ token, TypeUser: 'SuperAdmin' }); // Token é enviado para o front-end
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

                    // Verifica se há valores nulos em qualquer propriedade do objeto empresa, exceto em empresa.Logo e empresa.Site
                    const ValoresNulosObtidos = Object.keys(empresa).some(key => {
                        return key !== 'Logo' && key !== 'Site' && empresa[key] === null;
                    });


                    // Gera o token JWT se a senha for válida.
                    const token = jwt.sign(
                        { id_user: empresa.id, id_EmpresaDb: empresa.id, Nome_user: empresa.Gestor, RazaoSocial: empresa.RazaoSocial, Logo: empresa.Logo, Email: empresa.email, Status: empresa.Autorizado, ValoresNull: ValoresNulosObtidos, TypeUser: 'Gestor' },
                        process.env.JWT_SECRET,
                        { expiresIn: '15m' } // Token expira em 15 minutos.
                    );

                    // Gera o refresh token.
                    const refreshToken = jwt.sign(
                        { id_user: empresa.id, Nome_user: empresa.Gestor, Type: 'Gestor', Status: empresa.Autorizado },
                        process.env.REFRESH_TOKEN_SECRET,
                        { expiresIn: '7d' } // Refresh token expira em 7 dias.
                    );
                    // Configura o cookie com o token JWT.
                    res.cookie('jwt_token', token, { httpOnly: true, secure: false });
                    res.cookie('rt_jwt_token', refreshToken, { httpOnly: true, secure: false });
                    // Registra log de login bem-sucedido
                    await logAction(empresa.id, empresa.Gestor, 'Login', 'cadastro_empresarial');
                    await logActionEmpresa(empresa.id, empresa.id, empresa.Gestor, 'Login', 'erp.cadastro_empresarial')
                    // Conectar ao banco de dados da empresa específica.
                    const empresaDb = createEmpresaKnexConnection(`empresa_${empresa.id}`);
                    req.empresaDb = empresaDb;
                    res.status(200).send({ token, TypeUser: 'Gestor' }); // Envia o token para o front-end
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
                            { expiresIn: '15m' } // Token expira em 15 minutos.
                        );

                        // Gera o refresh token.
                        const refreshToken = jwt.sign(
                            { id_user: funcionario.id, Nome_user: funcionario.Nome, id_EmpresaDb: funcionario.Empresa, Type: 'Funcionario', },
                            process.env.REFRESH_TOKEN_SECRET,
                            { expiresIn: '7d' } // Refresh token expira em 7 dias.
                        );
                        // Registra log de login bem-sucedido
                        await logActionEmpresa(funcionario.Empresa, funcionario.id, funcionario.Nome, 'Login', 'Funcionario')
                        // Configura o cookie com o token JWT.
                        res.cookie('jwt_token', token, { httpOnly: true, secure: false });
                        res.cookie('rt_jwt_token', refreshToken, { httpOnly: true, secure: false });
                        res.status(200).send({ token, TypeUser: funcionario.TypeUser }); // Envia o token para o front-end
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

// JWT

// Usando a função verifyToken na rota
app.get('/verifyToken', verifyToken);

//CADASTRO_EMPRESARIAL

// Registro das empresas
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

app.post('/registro', upload.single('Logo'), async (req, res) => {
    const { RazaoSocial, CNPJ, Gestor, Email, senha } = req.body;

    try {
        let logoFilename = null;
        if (req.file) {
            logoFilename = req.file.filename;
        }

        const existingCompanyByName = await mainDb('cadastro_empresarial').where({ RazaoSocial }).first();
        if (existingCompanyByName) {
            return res.status(409).send({ errorCode: 409, message: "Empresa já registrada" });
        }

        const existingCompanyByCnpj = await mainDb('cadastro_empresarial').where({ CNPJ }).first();
        if (existingCompanyByCnpj) {
            return res.status(409).send({ errorCode: 409, message: "CNPJ já registrado" });
        }

        const hashedSenha = await bcrypt.hash(senha, 10);

        const [createdCompanyId] = await mainDb('cadastro_empresarial').insert({
            RazaoSocial,
            CNPJ,
            Logo: logoFilename,
            Gestor,
            Email,
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
    const refreshToken = req.cookies.rt_jwt_token

    // Limpar o token JWT do cliente
    res.clearCookie('jwt_token', 'rt_jwt_token');
    console.log('Usuário desconectado');

    res.sendStatus(200);
});

//POSTS -- Complementação das informações do Registro de Empresa

// Configuração do multer para salvar documentos em uploads/Docs/CadastroEmpresas
const DocsEmpresa = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/Docs/CadastroEmpresas/');
    },
    filename: function (req, file, cb) {
      // Salva apenas o nome original do arquivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `${uniqueSuffix}-${file.originalname}`;
      cb(null, fileName);
    }
  });
  
  const DocsEmpresaUpload = multer({ storage: DocsEmpresa });
  
  // Função de update para atualizar as informações da empresa
  app.post('/updateEmpresa/:id', DocsEmpresaUpload.fields([
    { name: 'ContratoSocial', maxCount: 1 },
    { name: 'RequerimentoEmpresario', maxCount: 1 },
    { name: 'CertificadoMEI', maxCount: 1 },
  ]), async (req, res) => {
    const {
      InscricaoEstadual,
      Municipio,
      UF,
      Logradouro,
      Numero,
      CEP,
      Complemento,
      Telefone,
      Site,
      CPF,
      RG
    } = req.body;
  
    const { id } = req.params; // O ID da empresa está na URL
  
    try {
      const updateData = {
        InscricaoEstadual,
        Municipio,
        UF,
        Logradouro,
        Numero,
        CEP,
        Complemento,
        Telefone,
        Site,
        CPF,
        RG
      };
  
      // Verifica e adiciona os nomes dos arquivos
      if (req.files.ContratoSocial) {
        updateData.ContratoSocial = req.files.ContratoSocial[0].filename;
      }
      if (req.files.RequerimentoEmpresario) {
        updateData.RequerimentoEmpresario = req.files.RequerimentoEmpresario[0].filename;
      }
      if (req.files.CertificadoMEI) {
        updateData.CertificadoMEI = req.files.CertificadoMEI[0].filename;
      }
  
      // Atualiza as informações da empresa no banco de dados
      await mainDb('cadastro_empresarial').where({ id }).update(updateData);
  
      res.status(200).json({ message: 'Informações atualizadas com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar informações da empresa:', err);
      res.status(500).json({ message: 'Erro ao atualizar informações da empresa.' });
    }
  });

// POST - EMPRESAS

// Função para cadastrar um funcionário
app.post('/cadastro_funcionario', async (req, res) => {
  const { Nome, Senha, TypeUser, Email, id, id_EmpresaDb, userId, userName } = req.body;

  try {
    // Verifica se o funcionário já existe
    const existingUser = await createEmpresaKnexConnection(`empresa_${id}`)('funcionario').where({ Nome }).first();
    if (existingUser) {
      return res.status(409).json({ message: 'Funcionário já existe.' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(Senha, 10);

    // Inserção no banco de dados
    await createEmpresaKnexConnection(`empresa_${id}`)('funcionario').insert({
      Nome,
      Senha: hashedPassword,
      TypeUser,
      Email
    });

    await logActionEmpresa(id_EmpresaDb, userId, userName, `Cadastrou um funcionário com o nome: ${Nome}, e com o cargo de ${TypeUser}`, `empresa_${id_EmpresaDb}.funcionario`)
    return res.status(200).json({ message: 'Funcionário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar funcionário.' });
  }
});


// Verifique se o diretório existe, caso contrário, crie-o
const uploadDir = 'uploads/ProdutosIMG/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento de arquivos
const storageProdutosImagens = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s/g, '_');
    const uniqueFilename = `${timestamp}-${originalName}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para aceitar apenas arquivos de imagem
const fileFilterImg = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    console.log('Arquivo inválido:', file.originalname, 'MIME:', file.mimetype, 'Extensão:', path.extname(file.originalname).toLowerCase());
    return cb(new Error('Somente arquivos de imagem são permitidos!'), false);
  }
};

const uploadProdutosImagens = multer({
  storage: storageProdutosImagens,
  fileFilter: fileFilterImg
}).single('Imagem');

// Rota para registrar produtos
app.post('/RegistrarProduto/:id', (req, res) => {
  uploadProdutosImagens(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Erro do Multer
      console.error('Erro do multer:', err);
      return res.status(500).send({ message: 'Erro ao processar o upload da imagem' });
    } else if (err) {
      // Erro de validação do arquivo
      console.error('Erro de validação:', err.message);
      return res.status(400).send({ message: err.message });
    }

    const { id } = req.params;
    const { Nome, Quantidade, ValorUnitario, Estoque, Fornecedor, Tamanho, userId, userName } = req.body;
    const Imagem = req.file ? req.file.filename : null;

    if (!Imagem) {
      console.error('Erro: Imagem não recebida ou inválida.');
      return res.status(400).send({ message: 'Erro: Imagem não recebida ou inválida.' });
    }

    try {
      const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
      const [newId] = await knexInstance('estoque').insert({
        Nome,
        Quantidade,
        ValorUnitario,
        Estoque,
        Imagem,
        Fornecedor,
        Tamanho
      });
      console.log(userId, userName)
      await logActionEmpresa(id, userId, userName, `Registrou um produto com o nome: ${Nome}`, `empresa_${id}.estoque`)

      res.status(201).send({ id: newId, message: 'Produto adicionado com sucesso!' });
    } catch (error) {
      console.error('Erro ao adicionar produto na tabela Estoque:', error);
      res.status(500).send({ message: 'Erro ao adicionar produto na tabela Estoque' });
    }
  });
});

//CLIENTES
app.post(`/registerCliente`, async (req, res) => {
  const {
    id_EmpresaDb,
    razao_social,
    cpf_cnpj,
    observacoes,
    nome_fantasia,
    logradouro,
    bairro,
    cidade,
    cep,
    uf,
    endereco,
    email, 
    telefone,
    ativo,
    ie,
    dia_para_faturamento,
    ramo_atividade,
    funcionario,
    limite,
    site,
    autorizados,
   } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    const [newId] = await knexInstance('cliente').insert({
      razao_social,
      cpf_cnpj,
      observacoes,
      nome_fantasia,
      logradouro,
      bairro,
      cidade,
      cep,
      uf,
      endereco,
      email, 
      telefone,
      ativo,
      ie,
      dia_para_faturamento,
      ramo_atividade,
      funcionario,
      limite,
      site,
      autorizados
    });
    res.status(200).send({ id: newId, message: 'Cliente registrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar Cliente na tabela Clientes:', error);
    res.status(500).send({ message: 'Erro ao adicionar Cliente na tabela Clientes' });
  }
});

//FORNECEDORES
app.post("/registerFornecedor", async (req, res) => {
  const {
    id_EmpresaDb,
    razao_social,
    cpf_cnpj,
    observacoes,
    nome_fantasia,
    logradouro,
    bairro,
    cidade,
    cep,
    uf,
    endereco,
    email,
    telefone,
    ie,
    ramo_atividade,
    site,
  } = req.body;

  try {
    // Criando conexão com o banco de dados específico da empresa
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    
    // Inserindo dados do fornecedor na tabela 'fornecedor'
    const [newId] = await knexInstance("fornecedor").insert({
      razao_social,
      cpf_cnpj,
      observacoes,
      nome_fantasia,
      logradouro,
      bairro,
      cidade,
      cep,
      uf,
      endereco,
      email,
      telefone,
      ie,
      ramo_atividade,
      site,
    });

    res.status(200).send({ id: newId, message: "Fornecedor registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao adicionar Fornecedor:", error);
    res.status(500).send({ message: "Erro ao adicionar Fornecedor na tabela Fornecedor" });
  }
});


// VENDAS
app.post(`/registrarPedido/:id`, async (req, res) => {
  const { nome_cliente, produto, desconto, total, vendedor } = req.body;

  console.log("Request body:", req.body); // Verificar os dados de entrada

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${req.params.id}`);

    // Converter a string JSON em um array de objetos
    const produtos = JSON.parse(produto);

    console.log("Produtos:", produtos); // Verificar se o array de produtos foi convertido corretamente

    // Iniciar a transação
    const trx = await knexInstance.transaction();

    try {
      // Inserir o pedido na tabela "venda"
      const [newId] = await trx('venda').insert({
        nome_cliente,
        produto: JSON.stringify(produtos), // Enviar o produto como JSON
        desconto,
        total,
        vendedor
      });

      // Processar os produtos um por um
      for (const item of produtos) {
        const { Codigo, quantidade } = item;

        console.log("Produto - Codigo:", Codigo, "Quantidade:", quantidade); // Verificar valores de Codigo e quantidade

        // Verificar se o produto existe no estoque
        const estoqueAtual = await trx('estoque')
          .where('Codigo', Codigo)
          .select('Quantidade')
          .first();

        if (!estoqueAtual) {
          throw new Error(`Produto com Codigo: ${Codigo} não encontrado.`);
        }

        // Verificar se há quantidade suficiente no estoque
        if (estoqueAtual.Quantidade < quantidade) {
          throw new Error(`Estoque insuficiente para o produto ID: ${Codigo}`);
        }

        // Subtrair a quantidade utilizada do estoque
        await trx('estoque')
          .where('Codigo', Codigo)
          .update({
            Quantidade: estoqueAtual.Quantidade - quantidade
          });
      }

      // Finalizar a transação
      await trx.commit();
      res.status(201).send({ id: newId, message: 'Venda registrada e estoque atualizado com sucesso!' });

    } catch (error) {
      // Em caso de erro, desfazer todas as alterações (rollback)
      await trx.rollback();
      console.error('Erro ao registrar pedido ou atualizar estoque:', error);
      res.status(500).send({ message: 'Erro ao registrar pedido ou atualizar estoque' });
    }

  } catch (error) {
    console.error('Erro ao adicionar venda na tabela Venda:', error);
    res.status(500).send({ message: 'Erro ao adicionar venda na tabela Venda' });
  }
});


//DESPESAS
app.post(`/registrarDespesas`, async (req, res) => {
  const { Valor, Nome, DataExpiracao, id_EmpresaDb, userName, userId } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    const [newId] = await knexInstance('despesas').insert({
      Valor,
      Nome,
      DataExpiracao,
    });

    await logActionEmpresa(id_EmpresaDb, userId, userName, `Registrou uma despesa com o nome: ${Nome}`, `empresa_${id_EmpresaDb}.despesas`)
    res.status(201).send({ id: newId, message: 'despesa registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar despesa na tabela despesa:', error);
    res.status(500).send({ message: 'Erro ao adicionar For na tabela despesa' });
  }
});

//RECEITAS
app.post(`/registrarReceitas`, async (req, res) => {
  const { Nome, Valor, id_EmpresaDb, userId, userName } = req.body;
  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    const [newId] = await knexInstance('receitas').insert({
      Nome,
      Valor,
    });

    await logActionEmpresa(id_EmpresaDb, userId, userName, `Registrou uma receita com o nome: ${Nome}`, `empresa_${id_EmpresaDb}.receitas`)
    res.status(201).send({ id: newId, message: 'receita registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar receita na tabela receita:', error);
    res.status(500).send({ message: 'Erro ao adicionar For na tabela receitas' });
  }
});

//PAGAMENTOS
app.post(`/registrarPagamento`, async (req, res) => {
  const { Valor, Nome, Data, Conta, TipoPagamento, Descricao, id_EmpresaDb, userName, userId } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    const [newId] = await knexInstance('pagamentos').insert({
      Valor,
      Nome,
      Data,
      Conta,
      TipoPagamento,
      Descricao,
    });
    await logActionEmpresa(id_EmpresaDb, userId, userName, `Registrou uma despesa com o nome: ${Nome}`, `empresa_${id_EmpresaDb}.despesas`)
    res.status(201).send({ id: newId, message: 'despesa registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar despesa na tabela despesa:', error);
    res.status(500).send({ message: 'Erro ao adicionar For na tabela despesa' });
  }
});

//IMPOSTOS
app.post(`/registrarImpostos`, async (req, res) => {
  const { uf, aliquota, tipo, id_EmpresaDb, userId, userName } = req.body;
  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    const [newId] = await knexInstance('impostos').insert({
      uf,
      aliquota,
      tipo,
    });

    await logActionEmpresa(id_EmpresaDb, userId, userName, `Registrou uma receita com o nome: ${Nome}`, `empresa_${id_EmpresaDb}.receitas`)
    res.status(201).send({ id: newId, message: 'receita registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar receita na tabela receita:', error);
    res.status(500).send({ message: 'Erro ao adicionar For na tabela receitas' });
  }
});

// REGISTRO PLANOS
app.post(`/registrarPlanos/:id`, upload.none(), async (req, res) => {
  const { id } = req.params;
  const {
    codigo_plano,
    descricao,
    mascara,
    userId,
    userName,
  } = req.body;

  // Debugging log
  console.log('Dados recebidos:', req.body);

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('planos').insert({
      codigo_plano,
      descricao,
      mascara,
    });

    await logActionEmpresa(id, userId, userName, `Registrou uma conta com o ID: ${newId}`, `empresa_${id}.conta`);

    res.status(201).send({ id: newId, message: 'Conta registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar transação na tabela Contas:', error);
    res.status(500).send({ message: 'Erro ao adicionar conta na tabela' });
  }
});


// REGISTRO CONTAS
app.post(`/registrarContas/:id`, upload.none(), async (req, res) => {
  const { id } = req.params;
  const {
    codigo_reduzido,
    descricao,
    mascara,
    orientacao,
    tipo,
    userId,
    userName,
  } = req.body;

  // Debugging log
  console.log('Dados recebidos:', req.body);

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('contas').insert({
      codigo_reduzido,
      descricao,
      mascara,
      orientacao,
      tipo,
    });

    await logActionEmpresa(id, userId, userName, `Registrou uma conta com o ID: ${newId}`, `empresa_${id}.conta`);

    res.status(201).send({ id: newId, message: 'Conta registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar transação na tabela Contas:', error);
    res.status(500).send({ message: 'Erro ao adicionar conta na tabela' });
  }
});


app.post(`/registroContabil/:id`, upload.none(), async (req, res) => {
  const { id } = req.params;
  const {
    mes_ano,
    lancamento,
    lote,
    unidade_negocio,
    data,
    documento,
    tipo_documento,
    debito_valor,
    debito_tipo, // Certifique-se de que este valor está sendo enviado
    debito_conta,
    credito_valor,
    credito_tipo, // Certifique-se de que este valor está sendo enviado
    credito_conta,
    transacao,
    empresa,
    valor_empresa,
    codigo_historico,
    historico_completo,
    userId,
    userName,
  } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('lancamento_contabil').insert({
      mes_ano,
      lancamento,
      lote,
      unidade_negocio,
      data_movimento: data,
      documento,
      tipo_documento,
      debito_valor,
      debito_tipo, // Debito tipo salvo no banco
      debito_conta,
      credito_valor,
      credito_tipo, // Credito tipo salvo no banco
      credito_conta,
      transacao_valor: transacao,
      empresa,
      empresa_valor: valor_empresa,
      codigo_historico,
      historico_completo,
    });

    await logActionEmpresa(id, userId, userName, `Registrou uma transação com o ID: ${newId}`, `empresa_${id}.transacoes`);

    res.status(201).send({ id: newId, message: 'Transação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar transação na tabela lancamento_contabil:', error);
    res.status(500).send({ message: 'Erro ao adicionar transação na tabela' });
  }
});

// PUT

// Rota para atualizar informações da venda
app.put('/RegisterVenda/:id_pedido', async (req, res) => {
  const { id_pedido } = req.params;
  const { cpf_cnpj, forma_pagamento, valor_total, selectedCliente, id } = JSON.parse(req.body.formData); // Recebe os dados do front-end

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    
    // 1. Recuperar o valor mais alto de id_venda
    const maxVenda = await knexInstance('venda')
      .max('id_venda as maxId')  // Buscar o valor máximo de id_venda
      .first(); // Pega o primeiro resultado
    
    let novoIdVenda = 1; // Se não houver registros, o id_venda começará em 1
    if (maxVenda && maxVenda.maxId) {
      novoIdVenda = maxVenda.maxId + 1; // Incrementa o maior valor atual
    }

    // 2. Atualizar o pedido com o novo id_venda
    await knexInstance('venda')
      .where({ id_pedido })
      .update({
        id_venda: novoIdVenda,
        cpf_cnpj,
        forma_pagamento
      });

    // 3. Definir o nome da receita
    const nomeReceita = `Venda: ${novoIdVenda}`;

    // 4. Definir a data de expiração com base no dia de faturamento ou na data atual
    let dataExpiracao = new Date(); // Por padrão, a data é a data atual
    if (selectedCliente.dia_para_faturamento) {
      // Definir a data de expiração com base no dia de faturamento
      const diaFaturamento = selectedCliente.dia_para_faturamento;
      dataExpiracao.setDate(diaFaturamento); // Atualiza o dia do mês para o faturamento
    }

    // 5. Inserir a nova receita na tabela 'receitas'
    await knexInstance('receitas').insert({
      Nome: nomeReceita,
      Valor: valor_total, // O valor da venda
      DataExpiracao: dataExpiracao // Data de expiração
    });

    // Enviar uma resposta de sucesso
    res.status(200).json({ message: 'Venda atualizada e receita registrada com sucesso!', novoIdVenda });
    
  } catch (error) {
    console.error('Erro ao atualizar a venda e registrar a receita:', error);
    return res.status(500).json({ message: 'Erro ao atualizar a venda e registrar a receita.' });
  }
});



// GET

// Historic Logs na Database principal 
app.get('/MainHistoricLogs', async (req, res) => {
  const { page = 1, limit = 12, year, month } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = mainDb('historico_logs').select('*').limit(limit).offset(offset).orderBy('timestamp', 'desc');

    if (year) {
      query = query.whereRaw('YEAR(timestamp) = ?', [year]);
    }

    if (month) {
      query = query.whereRaw('MONTH(timestamp) = ?', [month]);
    }

    const logs = await query;
    const totalLogs = await mainDb('historico_logs').count('* as count').first();
    const totalPages = Math.ceil(totalLogs.count / limit);

    res.status(200).json({ logs, currentPage: page, totalPages });
    console.log('Requisição do log efetuada com sucesso');
  } catch (err) {
    console.error('Erro ao buscar logs:', err);
    res.status(500).send('Erro ao buscar logs');
  }
});


// GET

// Historic Logs na Database da empresa 
app.get('/EmpresaHistoricLogs/:id', async (req, res) => {
  const id_EmpresaDb = req.params.id;  // Fixed variable name
  const { page = 1, limit = 10, year, month } = req.query;  // Default limit to 10
  const offset = (page - 1) * limit;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    const lenghtData = knexInstance('historicologs').select('*');
    let query = knexInstance('historicologs').select('*').limit(limit).offset(offset).orderBy('timestamp', 'desc');

    if (year) {
      query = query.whereRaw('YEAR(timestamp) = ?', [year]);
    }

    if (month) {
      query = query.whereRaw('MONTH(timestamp) = ?', [month]);
    }

    const logs = await query;
    const totalLogs = await knexInstance('historicologs').count('* as count').first();
    const totalPages = Math.ceil(totalLogs.count / limit);

    res.status(200).json({ logs, currentPage: page, totalPages,  N_Registros: (await lenghtData).length });
    console.log('Requisição do log efetuada com sucesso');
  } catch (err) {
    console.error('Erro ao buscar logs:', err);
    res.status(500).send('Erro ao buscar logs');
  }
});


app.listen(3002, () => {
    console.log('Server two listening on port 3002');
});