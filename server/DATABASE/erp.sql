-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 04/12/2024 às 13:15
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `erp`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `Nome` varchar(191) NOT NULL,
  `Senha` varchar(191) NOT NULL,
  `email` varchar(255) NOT NULL,
  `TypeUser` varchar(191) NOT NULL DEFAULT 'Admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `admin_users`
--

INSERT INTO `admin_users` (`id`, `Nome`, `Senha`, `email`, `TypeUser`) VALUES
(1, 'Gui', '$2b$10$9b5Hp06RCUVPQDj6ns6WyuxWwGHLmNTv17HI0B2amxsk1IO6f8qyW', 'gui@venturo.com', 'SuperAdmin'),
(2, 'Pedromil', '$2b$10$9b5Hp06RCUVPQDj6ns6WyuxWwGHLmNTv17HI0B2amxsk1IO6f8qyW', 'pedromil@venturo.com', 'SuperAdmin'),
(4, 'Caio Felipe', '$2b$10$J/GCvAhKMzDf53z.b3iEY.2gJHPyi.o.hnIBVFkG3EZRzhfCf2uhm', 'caiofelipe@venturo.com', 'SuperAdmin'),
(5, 'Isabella', '$2b$10$J/GCvAhKMzDf53z.b3iEY.2gJHPyi.o.hnIBVFkG3EZRzhfCf2uhm', 'isabella@venturo.com', 'SuperAdmin'),
(6, 'João Pedro', '$2b$10$J/GCvAhKMzDf53z.b3iEY.2gJHPyi.o.hnIBVFkG3EZRzhfCf2uhm', 'joaopedro@venturo.com', 'SuperAdmin');
(7, 'Marcio Denadai', '$2b$10$J/GCvAhKMzDf53z.b3iEY.2gJHPyi.o.hnIBVFkG3EZRzhfCf2uhm', 'marcio.denadai@venturo.com', 'SuperAdmin');
(8, 'Matheus Luiz', '$2b$10$J/GCvAhKMzDf53z.b3iEY.2gJHPyi.o.hnIBVFkG3EZRzhfCf2uhm', 'matheus.luiz@venturo.com', 'SuperAdmin');

-- --------------------------------------------------------

--
-- Estrutura para tabela `cadastro_empresarial`
--

CREATE TABLE `cadastro_empresarial` (
  `id` int(11) NOT NULL,
  `RazaoSocial` varchar(255) NOT NULL,
  `CNPJ` varchar(18) NOT NULL,
  `InscricaoEstadual` varchar(20) DEFAULT NULL,
  `Municipio` varchar(255) DEFAULT NULL,
  `UF` varchar(2) DEFAULT NULL,
  `Logradouro` varchar(255) DEFAULT NULL,
  `Numero` varchar(10) DEFAULT NULL,
  `CEP` varchar(9) DEFAULT NULL,
  `Complemento` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `Telefone` varchar(20) DEFAULT NULL,
  `Site` varchar(255) DEFAULT NULL,
  `Gestor` varchar(255) DEFAULT NULL,
  `Senha` varchar(255) NOT NULL,
  `CPF` varchar(15) DEFAULT NULL,
  `RG` varchar(20) DEFAULT NULL,
  `ContratoSocial` varchar(255) DEFAULT NULL,
  `RequerimentoEmpresario` varchar(255) DEFAULT NULL,
  `CertificadoMEI` varchar(255) DEFAULT NULL,
  `Logo` varchar(255) DEFAULT NULL,
  `Autorizado` varchar(255) NOT NULL DEFAULT 'NO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_logs`
--

CREATE TABLE `historico_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `table_name` varchar(255) NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mensagens`
--

CREATE TABLE `mensagens` (
  `id` int(11) NOT NULL,
  `Remetente` varchar(255) NOT NULL,
  `Destinatario` varchar(255) NOT NULL,
  `Assunto` varchar(255) DEFAULT NULL,
  `Mensagem` text DEFAULT NULL,
  `TimeStamp` datetime DEFAULT current_timestamp(),
  `Arquivo` varchar(255) DEFAULT NULL,
  `View` tinyint(1) NOT NULL DEFAULT 0,
  `remetenteDelete` tinyint(1) DEFAULT 0,
  `destinatarioDelete` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices de tabela `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `cadastro_empresarial`
--
ALTER TABLE `cadastro_empresarial`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `CNPJ` (`CNPJ`),
  ADD UNIQUE KEY `Email` (`email`);

--
-- Índices de tabela `historico_logs`
--
ALTER TABLE `historico_logs`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `mensagens`
--
ALTER TABLE `mensagens`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `cadastro_empresarial`
--
ALTER TABLE `cadastro_empresarial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT de tabela `historico_logs`
--
ALTER TABLE `historico_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1530;

--
-- AUTO_INCREMENT de tabela `mensagens`
--
ALTER TABLE `mensagens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
