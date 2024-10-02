require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { mainDb } = require('./modules/KnexJS/knexfile'); // Configurações do Knex 
const { createEmpresaKnexConnection } = require('./modules/KnexJS/MultiSchemas') // Configurações da conexão dinâmica com o banco da empresa
const { checkIfDatabaseExists } = require('./modules/middleware/MYSQL/CheckIfDatabaseExists') // Verifica se tem um banco de dados existente
const { copyDatabase } = require('./modules/Functions/MYSQL/CopyDatabase'); // Copia o banco de dados
const { createConnection } = require('./modules/KnexJS/CreateConnectionMultipleStatements'); // Cria uma conexxão sql MultipleStatements = true
const { logAction } = require('./modules/Functions/LOGS/LogAction_db'); // Função de Logs
const { logActionEmpresa } = require('./modules/Functions/LOGS/LogAction_db_empresas');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
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
app.use('/uploads/ProdutosIMG', express.static(path.join(__dirname, 'ProdutosIMG')));

// E-MAIL

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
      caminhoArquivo = arquivo.filename; // Salva apenas o nome do arquivo
    }

    // Insira os dados da mensagem no banco de dados
    const [emailId] = await mainDb('mensagens').insert({
      Remetente,
      Destinatario,
      Assunto,
      Mensagem,
      Arquivo: caminhoArquivo // Armazena o nome do arquivo no banco de dados
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

// Sugestão de e-mails
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

// E-mails recebidos
app.get('/caixa_entrada', async (req, res) => {
  const { Email } = req.query;

  try {
    const Emails = await mainDb('mensagens')
      .where({ 'Destinatario': Email, 'destinatarioDelete': 0 })
      .select('*');
      
    if (Emails.length > 0) {
      res.status(200).json(Emails);
      console.log(`E-mails enviados para ${Email}: `)
      console.table(Emails);
    } else {
      res.status(204).send('Não há mensagens para você');
      console.log('Não há mensagens para você');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor ', err);
  }
});

// Visualização do e-mail e remoção da notificação
app.put('/caixa_entrada/view', async (req, res) => {
  const { id } = req.body;

  try {
    await mainDb('mensagens')
      .where('id', id)
      .update({ View: 1 });

    res.status(200).send('E-mail marcado como lido');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao marcar o e-mail como lido', err);
  }
});

// E-mails enviados (Caixa de Saída)
app.get('/caixa_saida', async (req, res) => {
  const { Email } = req.query;

  try {
    const Emails = await mainDb('mensagens')
      .where({ 'Remetente': Email, 'remetenteDelete': 0 })
      .select('*');
      
    if (Emails.length > 0) {
      res.status(200).json(Emails);
      console.log(`E-mails enviados por ${Email}: `)
      console.table('Caixa de Saída: ', Emails);
    } else {
      res.status(204).send('Você não enviou nenhuma mensagem');
      console.log('Você não enviou nenhuma mensagem');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor ', err);
  }
});

// Removendo visualização do remetente para um e-mail
app.put('/excluir_email_remetente', async (req, res) => {
  const { id } = req.body;

  try {
      await mainDb('mensagens')
          .where('id', id)
          .update('remetenteDelete', 1);
      res.status(200).send('E-mail excluído com sucesso.');
  } catch (err) {
      console.error('Erro ao excluir o e-mail', err);
      res.status(500).send('Erro no servidor.');
  }
});

// Removendo visualização do destinatário para um e-mail
app.put('/excluir_email_destinatario', async (req, res) => {
  const { id } = req.body;

  try {
      await mainDb('mensagens')
          .where('id', id)
          .update('destinatarioDelete', 1);
      res.status(200).send('E-mail excluído com sucesso.');
  } catch (err) {
      console.error('Erro ao excluir o e-mail', err);
      res.status(500).send('Erro no servidor.');
  }
});


//DELETE

// DELETE - EMPRESAS

//ESTOQUE
app.delete(`/tableEstoqueDelete/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { produtoId } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('estoque').where({ id: produtoId }).del();

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

//PAGAMENTOS
app.delete(`/tablePagamentosDelete/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { pagamentoId } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('pagamentos').where({ id: pagamentoId }).del();

    if (rowsDeleted) {
      res.status(200).send({ message: 'Registro de Pagamento deletado com sucesso!' });
    } else {
      res.status(404).send({ message: 'Registro de Pagamento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar Registro de Pagamento da tabela pagamentos:', error);
    res.status(500).send({ message: 'Erro ao deletar Registro de Pagamento da tabela pagamentos' });
  }
});

//DESPESAS
app.delete(`/tableDespesasDelete/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { despesasId } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('despesas').where({ id: despesasId }).del();

    if (rowsDeleted) {
      res.status(200).send({ message: 'Registro de despesa deletado com sucesso!' });
    } else {
      res.status(404).send({ message: 'Registro de despesa não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar Registro de despesa da tabela despesa:', error);
    res.status(500).send({ message: 'Erro ao deletar Registro de despesa da tabela despesa' });
  }
});

//CLIENTES
app.delete(`/tableCliente/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo os IDs do produto da rota
  const { ClienteId } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const rowsDeleted = await knexInstance('cliente').where({ id: ClienteId }).del();

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
    const estoqueInfo = await knexInstance('estoque').select('*');
    res.status(200).send({ InfoTabela: estoqueInfo, N_Registros: estoqueInfo.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

// VENDAS
app.get(`/tableVenda/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const vendaINFO = await knexInstance('venda').select('*');
    res.status(200).send({ InfoTabela: vendaINFO, N_Registros: vendaINFO.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Venda:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

// Rota para obter informações da tabela Pagamentos
app.get(`/tablepagamentos/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const pagamentoInfo = await knexInstance('pagamentos').select('*');
    res.status(200).send({ InfoTabela: pagamentoInfo });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Pagamentos:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Pagamentos' });
  }
});


// Rota para obter informações da tabela Receitas
app.get(`/tablereceitas/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const estoqueInfo = await knexInstance('receitas').select('*');
    res.status(200).send({ InfoTabela: estoqueInfo });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela receitas:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela receitas' });
  }
});

// Rota para obter informações da tabela Despesas
app.get(`/tabledespesas/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const estoqueInfo = await knexInstance('despesas').select('*');
    res.status(200).send({ InfoTabela: estoqueInfo });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela despesas:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela despesas' });
  }
});

// Rota para obter informações da tabela Cliente
app.get(`/tableCliente/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('cliente').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

// Rota para obter informações da tabela Cliente
app.get(`/tableFornecedor/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('fornecedor').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

app.get('/tableFuncionario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const funcionarioInfo = await knexInstance('funcionario').select('*');
    res.status(200).send({ InfoTabela: funcionarioInfo, N_Registros: funcionarioInfo.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Funcionários:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Funcionário' });
  }
})

// Rota para obter informações da tabela Impostos
app.get(`/tableImpostos/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('impostos').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Impostos:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Impostos' });
  }
});


// Rota para obter informações da tabela Planos
app.get(`/tablePlanos/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('planos').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela planos:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela planos' });
  }
});

// Rota para obter contas filtradas pela orientação (débito, crédito ou ambos)
app.get(`/tableContas/:id/:orientacao`, async (req, res) => {
  const { id, orientacao } = req.params; // Obtendo o ID da empresa e a orientação da rota

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    
    // Consultando a tabela de contas com base na orientação
    const response = await knexInstance('contas')
      .select('*')
      .where('orientacao', orientacao)
      .orWhere('orientacao', 'Ambos'); // Inclui as contas com orientação 'Ambos'

    res.status(200).send(response);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    res.status(500).send({ message: 'Erro ao buscar contas da tabela Contas' });
  }
});

// UPDATES

app.get('/autorizar/:id', async (req, res) => {
  const { id } = req.params;
  const {id_user, Nome_user} = req.body

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
        -- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS ${dbName};
USE ${dbName};

CREATE TABLE funcionario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Nome VARCHAR(255) NOT NULL,
  Senha VARCHAR(255),
  TypeUser VARCHAR(50),
  email VARCHAR(255) NOT NULL UNIQUE,
  DataInserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
  Empresa INT(11) DEFAULT '${id}'
);

CREATE TABLE receitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Nome VARCHAR(255) NOT NULL,
  Valor DECIMAL(15, 2) NOT NULL,
  DataExpiracao datetime DEFAULT current_timestamp()
);

CREATE TABLE despesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Nome VARCHAR(255) NOT NULL,
  Valor DECIMAL(15, 2) NOT NULL,
  DataExpiracao DATETIME NOT NULL,
  Finalizado TINYINT(1) DEFAULT "0"
);

CREATE TABLE notafiscal (
  Numero INT PRIMARY KEY,
  Serie VARCHAR(50) NOT NULL,
  DataEmissao DATE NOT NULL,
  FornecedorOuCliente VARCHAR(255) NOT NULL
);

CREATE TABLE venda (
  id_venda INT,
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  nome_cliente VARCHAR(100),       -- Nome do cliente
  produto TEXT,            -- Nome do produto
  desconto DECIMAL(10, 2),         -- Desconto aplicado
  forma_pagamento VARCHAR(50),     -- Forma de pagamento (Ex: Cartão, Boleto)
  total DECIMAL(10, 2),            -- Valor total da venda
  garantia VARCHAR(50),            -- Garantia oferecida (Ex: 1 ano, 6 meses)
  vendedor VARCHAR(100)            -- Nome do vendedor
);

CREATE TABLE planos (
  codigo_plano VARCHAR(50) PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  mascara VARCHAR(50) NOT NULL
);


CREATE TABLE contas (
  codigo_reduzido VARCHAR(50) PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  mascara VARCHAR(50) NOT NULL,
  orientacao ENUM('Crédito', 'Débito', 'Ambos') NOT NULL,
  tipo ENUM('Sintética', 'Analítica') NOT NULL
);


CREATE TABLE cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  logradouro VARCHAR(255),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  cep VARCHAR(10),
  uf VARCHAR(2),
  endereco varchar(255),
  email VARCHAR(255),
  autorizados TEXT ,
  observacoes TEXT,
  dia_para_faturamento DATETIME,  -- Alterado para DATETIME
  funcionario TEXT,
  ramo_atividade VARCHAR(255) ,
  limite DECIMAL(10, 2),
  site VARCHAR(255),
  ativo ENUM('SIM', 'NÃO'),
  cpf_cnpj VARCHAR(18) ,
  ie VARCHAR(20),
  telefone VARCHAR(20),
  celular VARCHAR(20)
);

CREATE TABLE fornecedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  logradouro VARCHAR(255),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  cep VARCHAR(10),
  uf VARCHAR(2),
  endereco varchar(255),
  email VARCHAR(255),
  observacoes TEXT,
  ramo_atividade VARCHAR(255) ,
  site VARCHAR(255),
  cpf_cnpj VARCHAR(18) ,
  ie VARCHAR(12),
  telefone VARCHAR(20),
  celular VARCHAR(20)
);

CREATE TABLE estoque (
  Codigo INT PRIMARY KEY AUTO_INCREMENT,
  Nome VARCHAR(255) NOT NULL,
  Quantidade INT NOT NULL,
  ValorUnitario DECIMAL(15, 2) NOT NULL,
  Fornecedor VARCHAR(255),
  Tamanho VARCHAR(255),
  Imagem VARCHAR(255),
  Estoque INT NOT NULL
);

CREATE TABLE historicologs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Impostos (
  uf VARCHAR(2) PRIMARY KEY,  -- Código da UF com 2 caracteres
  aliquota DECIMAL(5, 2) NOT NULL,  -- Alíquota com até 5 dígitos, 2 casas decimais
  tipo ENUM('ICMS', 'ISS', 'PIS', 'COFINS', 'OUTRO') NOT NULL  -- Tipos de impostos
);

CREATE TABLE lancamento_contabil (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mes_ano DATE NOT NULL,
  lancamento INT NOT NULL,
  lote VARCHAR(50) NOT NULL,
  unidade_negocio VARCHAR(100) NOT NULL,
  data_movimento DATE NOT NULL,
  documento VARCHAR(100),
  tipo_documento VARCHAR(50),
  debito_valor DECIMAL(10, 2) NOT NULL,
  debito_tipo ENUM('ativo', 'passivo') NOT NULL,
  debito_conta ENUM('bancos_cta_movimento', 'outra_conta') NOT NULL,
  credito_valor DECIMAL(10, 2) NOT NULL,
  credito_tipo ENUM('ativo', 'passivo') NOT NULL,
  credito_conta ENUM('bancos_cta_movimento', 'outra_conta') NOT NULL,
  transacao_valor DECIMAL(10, 2) NOT NULL,
  empresa VARCHAR(100) NOT NULL,
  empresa_valor DECIMAL(10, 2) NOT NULL,
  codigo_historico INT NOT NULL,
  historico_completo TEXT NOT NULL
);

CREATE TABLE transacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ContaId INT NOT NULL,
  Data DATE NOT NULL,
  Valor DECIMAL(15, 2) NOT NULL,
  Tipo VARCHAR(50) NOT NULL
);

CREATE TABLE pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Nome VARCHAR(255) NOT NULL,
  Valor DECIMAL(15, 2) NOT NULL,
  Data DATE NOT NULL,
  Conta INT NOT NULL,
  TipoPagamento VARCHAR(50), 
  Descricao TEXT
);

      `;
      await connection.query(createDatabaseAndTables);
    }

    await connection.end();

    // Registra log
    await logAction(id_user, Nome_user, `Autorizou Empresa_${id}`, `cadastro_empresarial and DB empresa_${id}`);

    res.status(200).send('Empresa autorizada e banco de dados configurado.');
  } catch (err) {
    console.error("Erro ao autorizar empresa:", err); // Log detalhado
    res.status(500).send("Não foi possível fazer a requisição");
  }
});


app.get('/desautorizar/:id', async (req, res) => {
  const { id } = req.params;
  const {id_user, Nome_user} = req.body

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

//CLIENTES
app.put(`/tableCliente/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, CPF_CNPJ, Enderecoid } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('cliente').insert({
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
app.put(`/tableFornecedorRegistro/:id`, async (req, res) => {
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

//PAGAMENTOS
app.put(`/tablePagamentosRegistro/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, Valor, Data, Conta, TipoPagamento, Descricao } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('pagamentos').insert({
      Nome,
      CNPJ,
      Enderecoid,
    });
    res.status(201).send({ id: newId, message: 'Registro de pagamento atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar pagamento na tabela pagamento:', error);
    res.status(500).send({ message: 'Erro ao atualizar pagamento na tabela pagamento' });
  }
});

//VENDAS
app.put(`/tableVendasUp/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { nome_cliente, produto, quantidade, desconto, forma_pagamento, total, garantia, vendedor } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('venda').insert({
      Nome,
      CNPJ,
      Enderecoid,
    });
    res.status(201).send({ id: newId, message: 'Registro de Vendas atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar Venda na tabela Vendas:', error);
    res.status(500).send({ message: 'Erro ao atualizar Venda na tabela Vendas' });
  }
});

//CONTAS
app.put(`/tableContasUp/:id`, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { codigo_reduzido, descricao, mascara, orientacao, tipo } = req.body;

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const [newId] = await knexInstance('contas').insert({
      codigo_reduzido,
      descricao,
      mascara,
      orientacao,
      tipo,
    });
    res.status(201).send({ id: newId, message: 'Registro de Contas atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar Conta na tabela Contas:', error);
    res.status(500).send({ message: 'Erro ao atualizar Conta na tabela Contas' });
  }
});


// DESPESAS

// Mudar o estado finalizado para 1
app.put('/tableDespesasFinalizado/:id', async (req, res) => {
  const { id } = req.params;
  const {id_EmpresaDb} = req.body

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    await knexInstance('despesas')
      .where('id', id)
      .update({ Finalizado: 1 });

    res.sendStatus(200); // Envia uma resposta 200 OK
  } catch (err) {
    console.log("Erro ao alterar estado: ", err);
    res.sendStatus(500); // Envia uma resposta 500 Internal Server Error
  }
});

// Mudar o estado finalizado para 1
app.put('/tableDespesasNaoFinalizado/:id', async (req, res) => {
  const { id } = req.params;
  const {id_EmpresaDb} = req.body

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id_EmpresaDb}`);
    await knexInstance('despesas')
      .where('id', id)
      .update({ Finalizado: 0 });

    res.sendStatus(200); // Envia uma resposta 200 OK
  } catch (err) {
    console.log("Erro ao alterar estado: ", err);
    res.sendStatus(500); // Envia uma resposta 500 Internal Server Error
  }
});

// Configurando o Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ProdutosIMG');  // Diretório onde os arquivos serão armazenados
  },
  filename: (req, file, cb) => {
    // Obter a hora atual e o nome original do arquivo
    const timestamp = Date.now();  // Pega o timestamp atual
    const originalName = file.originalname.replace(/\s+/g, '_');  // Remove espaços do nome original
    const fileExtension = path.extname(originalName);  // Extensão do arquivo original
    
    // Definir o novo nome do arquivo como "timestamp_nomeoriginal.ext"
    const newFileName = `${timestamp}_${path.basename(originalName, fileExtension)}${fileExtension}`;
    
    cb(null, newFileName);  // Salva o arquivo no servidor com o nome gerado
  }
});

// Filtro para permitir apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  
  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Apenas imagens são permitidas.'));
  }
};

// Configuração final do Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// ESTOQUE
app.put('/updateProduct/:id', upload.single('Imagem'), async (req, res) => {
  try {
    // Verifica se os dados foram recebidos corretamente
    const { Nome, Quantidade, ValorUnitario, Fornecedor, Tamanho, database_id } = req.body;
    const imagem = req.file ? req.file.path : null;
    const id = req.params.id;

    // Log para depuração
    console.log('Dados recebidos:', req.body);
    console.log('Imagem recebida:', imagem);

    // Lógica para atualizar o produto no banco de dados
    const updatedData = {
      Nome,
      Quantidade,
      ValorUnitario,
      Fornecedor,
      Tamanho,
    };

    // Atualiza a imagem somente se houver uma nova imagem enviada
if (req.file) {
  updatedData.Imagem = req.file.filename;  // Salva apenas o nome do arquivo no banco de dados
}

    const knexInstance = createEmpresaKnexConnection(`empresa_${database_id}`);

    // Atualiza o produto no banco de dados
    await knexInstance('estoque')
      .where({ Codigo: id })
      .update(updatedData);

    return res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ message: 'Erro ao atualizar produto.' });
  }
});


app.listen(3001, () => {
  console.log('Server One listening on port 3001');
});