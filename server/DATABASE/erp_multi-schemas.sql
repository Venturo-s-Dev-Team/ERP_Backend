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
          Descricao VARCHAR(255),
          Valor DECIMAL(15, 2) NOT NULL
        );

        CREATE TABLE NotaFiscal (
          Numero INT PRIMARY KEY,
          Serie VARCHAR(50) NOT NULL,
          DataEmissao DATE NOT NULL,
          FornecedorOuCliente VARCHAR(255) NOT NULL
        );


        CREATE TABLE CadastroCliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    endereco VARCHAR(255),
    bairro VARCHAR(100),
    email VARCHAR(255),
    autorizados ENUM('SIM', 'NÃO'),
    observacoes TEXT,
    dia_para_faturamento DATETIME,
    funcionario ENUM('SIM', 'NÃO'),
    ramo_atividade VARCHAR(255),
    isento ENUM('SIM', 'NÃO'),
    limite DECIMAL(10, 2),
    site VARCHAR(255),
    ativo ENUM('SIM', 'NÃO'),
    cnpj VARCHAR(18),
    ie VARCHAR(12),
    numero INT,
    cidade VARCHAR(100),
    telefone VARCHAR(20),
    cep VARCHAR(10),
    uf VARCHAR(2),
    celular VARCHAR(20)
);


        CREATE TABLE Fornecedor (
          id INT PRIMARY KEY AUTO_INCREMENT,
          Nome VARCHAR(255) NOT NULL,
          CNPJ VARCHAR(18) NOT NULL UNIQUE,
          Enderecoid INT,
          FOREIGN KEY (Enderecoid) REFERENCES Endereco(id)
        );

        CREATE TABLE Estoque (
  Codigo INT PRIMARY KEY AUTO_INCREMENT,
  Nome VARCHAR(255) NOT NULL,
  Quantidade INT NOT NULL,
  ValorUnitario DECIMAL(15, 2) NOT NULL,
  Fornecedor VARCHAR(255),
  Estoque INT NOT NULL
);


        CREATE TABLE `historico_logs` (
         id INT PRIMARY KEY AUTO_INCREMENT,
         user_id int(11) NOT NULL,
         user_name varchar(255) NOT NULL,
         action varchar(255) NOT NULL,
         table_name varchar(255) NOT NULL,
         timestamp datetime DEFAULT current_timestamp()
        );
      ;