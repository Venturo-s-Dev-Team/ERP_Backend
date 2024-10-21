const createDatabaseAndTables = (dbName, id) => {
  return `
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

CREATE TABLE notas_fiscais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pdf_document LONGBLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
cpf_cnpj VARCHAR(18) ,
produto TEXT,            -- Nome do produto
desconto DECIMAL(10, 2),         -- Desconto aplicado
forma_pagamento VARCHAR(50),     -- Forma de pagamento (Ex: Cartão, Boleto)
total DECIMAL(10, 2),            -- Valor total da venda
garantia VARCHAR(50),            -- Garantia oferecida (Ex: 1 ano, 6 meses)
vendedor VARCHAR(100),            -- Nome do vendedor
Status VARCHAR(15) DEFAULT "EM ABERTO",
Data DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE contas (
id INT AUTO_INCREMENT PRIMARY KEY,
plano VARCHAR(50) NOT NULL,
codigo_reduzido VARCHAR(50),
descricao VARCHAR(255) NOT NULL,
mascara VARCHAR(50) NOT NULL,
orientacao ENUM('Crédito', 'Débito', 'Ambos') NOT NULL,
tipo ENUM('Sintética', 'Analítica') NOT NULL
);


CREATE TABLE planos (
id INT AUTO_INCREMENT PRIMARY KEY,
codigo_plano VARCHAR(50),
descricao VARCHAR(255) NOT NULL,
mascara VARCHAR(50) NOT NULL
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
ie VARCHAR(20),
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
debito_conta VARCHAR(255) NOT NULL,
credito_valor DECIMAL(10, 2) NOT NULL,
credito_tipo ENUM('ativo', 'passivo') NOT NULL,
credito_conta VARCHAR(255) NOT NULL,
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
}

module.exports = { createDatabaseAndTables }