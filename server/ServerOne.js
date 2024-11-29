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
const { createDatabaseAndTables } = require('./modules/Functions/MYSQL/CreateDatabase') // Cria o banco de dados da empresa
const { verifyAcess } = require('./modules/middleware/Auth/JWT/Acess'); // Middleware para autorizar requisições
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
app.post('/email', uploadDocs.single('anexo'), verifyAcess, async (req, res) => {
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
app.get('/email_suggestions', verifyAcess, async (req, res) => {
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
app.get('/caixa_entrada', verifyAcess, async (req, res) => {
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
app.put('/caixa_entrada/view', verifyAcess, async (req, res) => {
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
app.get('/caixa_saida', verifyAcess, async (req, res) => {
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
app.put('/excluir_email_remetente', verifyAcess, async (req, res) => {
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
app.put('/excluir_email_destinatario', verifyAcess, async (req, res) => {
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


// GET

// Informações das empresas
app.get('/SelectInfoEmpresa/:id', verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

  if (req.user.TypeUser !== "SuperAdmin") {
    return res.status(403).json('403: Acesso inautorizado');
  }
  
  try {
    const SelectInfo = await mainDb('cadastro_empresarial').where({ id: parseInt(id) });

    if (SelectInfo && SelectInfo.length > 0) {
      const InfoEmpresa = { ...SelectInfo[0] }; // Copia os dados
      delete InfoEmpresa.Senha; // Exclui a chave 'Senha'
      res.status(200).json({ InfoEmpresa });
    } else {
      res.status(404).json('Empresa não encontrada');
    }
  } catch (error) {
    console.log('Erro ao coletar dados: ', error);
    res.status(500).json({ error: 'Erro ao coletar dados' });
  }
});

// TABELAS

// Rota para tabelas de super administradores
app.get('/tableSuperAdmins', verifyAcess, async (req, res) => {

  if (req.user.TypeUser != 'SuperAdmin') {
    return res.status(403).json('403: Acesso inautorizado')
  }

  try {
    const project_Users_Admin = await mainDb('admin_users').select();
    res.status(200).send({ DadosTabela: project_Users_Admin });
  } catch (err) {
    console.error('Erro ao carregar tabela:', err);
    res.status(500).send({ message: "Não foi possível fazer a requisição das informações" });
  }
});

// Rota para tabelas de empresas
app.get('/tableEmpresas', verifyAcess, async (req, res) => {

  if (req.user.TypeUser != 'SuperAdmin') {
    return res.status(403).json('403: Acesso inautorizado')
  }

  try {
    const project_CNPJ_Registers = await mainDb('cadastro_empresarial').select();

    console.log(project_CNPJ_Registers.length ,"empesa(s) encontrada(s)");
    res.status(200).json({ InfoTabela: project_CNPJ_Registers, user: req.user }); // Envia os dados da tabela e o usuário
  } catch (err) {
    console.log('Erro ao carregar tabela', err);
    return res.status(500).json({ errorCode: 500, message: "Não foi possível fazer a requisição das informações" });
  }
});

// TABLES --- EMPRESAS

// Rota para obter informações da tabela Estoque
app.get(`/tableEstoque/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.get(`/tableVenda/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const vendaINFO = await knexInstance('venda').select('*').whereNull('id_venda').andWhereNot('Status', '=', 'CANCELADA').andWhereNot('Status', '=', 'VENDA CONCLUIDA')
    res.status(200).send({ InfoTabela: vendaINFO, N_Registros: vendaINFO.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Venda:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

// Vendas em aberto
app.get('/VendasEmAberto/:id', verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda', "Caixa"].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);

    // Consulta para buscar registros onde 'id_venda' é nulo e 'Status' não é 'CANCELADO'
    const vendaINFO = await knexInstance('venda')
      .select('*')
      .whereNull('id_venda') // Filtra registros onde 'id_venda' é nulo
      .andWhereNot('Status', '=', 'CANCELADA'); // Filtra registros onde 'Status' não é 'CANCELADO'

    res.status(200).send({ InfoTabela: vendaINFO, N_Registros: vendaINFO.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Venda:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Venda' });
  }
});

// Vendas em aberto
app.get('/PedidosCancelados/:id', verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);

    // Consulta para buscar registros onde 'id_venda' é nulo e 'Status' não é 'CANCELADO'
    const vendaINFO = await knexInstance('venda')
      .select('*')
      .where('Status', '=', 'CANCELADA'); // Filtra registros onde 'Status' não é 'CANCELADO'

    res.status(200).send({ InfoTabela: vendaINFO, N_Registros: vendaINFO.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Venda:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Venda' });
  }
});

// Vendas concluídas 
app.get('/VendasConcluidas/:id', verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);

    // Consulta para buscar registros onde 'id_venda' é nulo e 'Status' não é 'CANCELADO'
    const vendaINFO = await knexInstance('venda')
      .select('*')
      .whereNotNull('id_venda') // Filtra registros onde 'id_venda' não é nulo

    res.status(200).send({ InfoTabela: vendaINFO, N_Registros: vendaINFO.length });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Venda:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Venda' });
  }
});

// Rota para obter informações da tabela Pagamentos
app.get(`/tablepagamentos`, verifyAcess, async (req, res) => {

    if (!['Gestor', 'Socio', 'Financeiro'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${req.user.id_EmpresaDb}`);
    const pagamentoInfo = await knexInstance('pagamentos').select('*');
    res.status(200).send({ InfoTabela: pagamentoInfo });
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Pagamentos:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Pagamentos' });
  }
});


// Rota para obter informações da tabela Receitas
app.get(`/tablereceitas/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda', 'Caixa'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.get(`/tabledespesas/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda', 'Caixa'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.get(`/tableCliente/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('cliente').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela cliente:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela cliente' });
  }
});

// Rota para obter informações de um único cliente
app.get(`/SelectedCliente/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params;
  const { razao_social } = req.query; // Mudamos para `razao_social`

  if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('cliente')
      .where('razao_social', razao_social) // Corrigido para `razao_social`
      .select('*'); // Seleciona todas as colunas

    res.status(200).send(response);
  } catch (err) {
    console.error('Erro ao buscar informações na tabela cliente:', err);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela cliente' });
  }
});

// Rota para obter informações da tabela Cliente
app.get(`/tableFornecedor/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('fornecedor').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela Estoque:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela Estoque' });
  }
});

app.get('/tableFuncionario/:id', verifyAcess, async (req, res) => {
  const { id } = req.params;

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.get(`/tableImpostos/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.get(`/tablePlanos/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    const response = await knexInstance('planos').select('*');
    res.status(200).send(response)
  } catch (error) {
    console.error('Erro ao buscar informações da tabela planos:', error);
    res.status(500).send({ message: 'Erro ao buscar informações da tabela planos' });
  }
});

// Rota para obter contas filtradas pela orientação (débito, crédito ou ambos) e pelo plano
app.get(`/tableContas/:id/:plano/:orientacao`, verifyAcess, async (req, res) => {
  const { id, plano, orientacao } = req.params; // Obtendo o ID da empresa, plano e a orientação da rota

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    const knexInstance = createEmpresaKnexConnection(`empresa_${id}`);
    
    // Consultando a tabela de contas com base na orientação e no plano
    const response = await knexInstance('contas')
      .select('*')
      .where('plano', plano) // Filtrando pelo plano
      .andWhere(function() {
        this.where('orientacao', orientacao)
            .orWhere('orientacao', 'Ambos');
      });

    res.status(200).send(response);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    res.status(500).send({ message: 'Erro ao buscar contas da tabela Contas' });
  }
});

// UPDATES

app.get('/autorizar/:id', verifyAcess, async (req, res) => {
  const { id } = req.params;
  const {id_user, Nome_user} = req.body

  if (req.user.TypeUser != "SuperAdmin") {
    return res.status(403).json('403: Acesso inautorizado')
  }

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
      const sqlQuery = createDatabaseAndTables(dbName, id);
      await connection.query(sqlQuery);
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


app.get('/desautorizar/:id', verifyAcess, async (req, res) => {
  const { id } = req.params;
  const {id_user, Nome_user} = req.body

  if (req.user.TypeUser != "SuperAdmin") {
    return res.status(403).json('403: Acesso inautorizado')
  }

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
app.put(`/tableCliente/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, CPF_CNPJ, Enderecoid } = req.body;

    if (!['Gestor', 'Socio', 'Gerente', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.put(`/tableFornecedorRegistro/:id`, verifyAcess, async (req, res) => {
  const { id } = req.params; // Obtendo o ID da empresa da rota
  const { Nome, CNPJ, Enderecoid } = req.body;

    if (!['Gestor', 'Socio', 'Gerente', 'Financeiro', 'Venda'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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

// DESPESAS

// Mudar o estado finalizado para 1
app.put('/tableDespesasFinalizado/:id', verifyAcess, async (req, res) => {
  const { id } = req.params;
  const {id_EmpresaDb} = req.body

    if (!['Gestor', 'Socio', 'Financeiro'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.put('/tableDespesasNaoFinalizado/:id', verifyAcess, async (req, res) => {
  const { id } = req.params;
  const {id_EmpresaDb} = req.body

    if (!['Gestor', 'Socio', 'Financeiro'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

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
app.put('/updateProduct/:id', upload.single('Imagem'), verifyAcess, async (req, res) => {

    if (!['Gestor', 'Socio', 'Gerente', 'Estoque'].includes(req.user.TypeUser)) {
    return res.status(403).json('403: Acesso inautorizado');
  }

  try {
    // Verifica se os dados foram recebidos corretamente
    const { Nome, Quantidade, ValorUnitario, Fornecedor, Tamanho, database_id, userId, userName } = req.body;
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

      await logActionEmpresa(database_id, userId, userName, `Atualizou um produto com o código ${id}`, `empresa_${database_id}.estoque`)

    return res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ message: 'Erro ao atualizar produto.' });
  }
});


app.listen(3001, () => {
  console.log('Server One listening on port 3001');
});