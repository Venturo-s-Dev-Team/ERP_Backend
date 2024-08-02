-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 31/07/2024 às 20:35
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
-- Estrutura para tabela `mensagens`
--

CREATE TABLE `mensagens` (
  `id` int(11) NOT NULL,
  `Remetente` varchar(255) NOT NULL,
  `Destinatario` varchar(255) NOT NULL,
  `Assunto` varchar(255) DEFAULT NULL,
  `Mensagem` text DEFAULT NULL,
  `TimeStamp` datetime DEFAULT current_timestamp(),
  `Arquivo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `mensagens`
--

INSERT INTO `mensagens` (`id`, `Remetente`, `Destinatario`, `Assunto`, `Mensagem`, `TimeStamp`, `Arquivo`) VALUES
(11, 'gui@venturo.com', 'joaopedro@venturo.com', 'Saudação', 'Good Morning Vietnam', '2024-08-02 10:24:57', NULL),
(12, 'joaopedro@venturo.com', 'gui@venturo.com', 'ABC', 'Priviet', '2024-08-02 10:25:48', NULL),
(13, 'gui@venturo.com', 'caiofelipe@venturo.com', 'Teste', 'BELEZMA', '2024-08-02 10:47:48', NULL),
(15, 'gui@venturo.com', 'joaopedro@venturo.com', 'Teste', 'opa', '2024-08-02 12:23:24', NULL),
(16, 'gui@venturo.com', 'andoriranio@venturo.com', 'Teste', 'banana', '2024-08-02 15:09:06', NULL),
(17, 'gui@venturo.com', 'guilherme.veiga.pedromilo@venturo.com', 'Venturo', 'Olá, somos a Venturo', '2024-08-02 15:14:56', NULL),
(18, 'guilherme.veiga.pedromilo@venturo.com', 'joaopedro@venturo.com', 'Teste', 'macarrão', '2024-08-02 15:31:33', NULL);

--
-- Índices de tabela `mensagens`
--

ALTER TABLE `mensagens`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `mensagens`
--
ALTER TABLE `mensagens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
