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