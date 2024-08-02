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
-- Estrutura para tabela `cadastro_empresarial`
--

CREATE TABLE `cadastro_empresarial` (
  `id` int(11) NOT NULL,
  `CNPJ` varchar(191) NOT NULL,
  `Gestor` varchar(191) NOT NULL,
  `Senha` varchar(191) NOT NULL,
  `Empresa` varchar(191) NOT NULL,
  `Logo` varchar(255) DEFAULT NULL,
  `Autorizado` varchar(191) NOT NULL DEFAULT 'NO',
  `email` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `cadastro_empresarial`
--

INSERT INTO `cadastro_empresarial` (`id`, `CNPJ`, `Gestor`, `Senha`, `Empresa`, `Logo`, `Autorizado`, `email`) VALUES
(35, '19.483.901/2742-14', 'Vader', '$2b$10$kISWA/7YtXxmwXzhdQ35XuE6LeCNbDp06WZRuxbWQwcbEjr.fZDP2', 'Império galáctico ', '1722621216666-150584744.jfif', 'NO', 'vader@venturo.com'),
(36, '71.787.683/0001-17', 'Andoriranio', '$2b$10$cET5umxPNxWznGaDmHrVBueSlbPbO1qJ1je//MeSFj1/V48hjLEla', 'Trem da 66', '1722621685149-324325846.png', 'NO', 'andoriranio@venturo.com'),
(37, '00.000.000/0000-00', 'Guilherme Veiga Pedromilo', '$2b$10$3mR6RuV1aV/S3JdfUBdMJO2ydoqgDlgtdV.P2tX8CYmahCBEDQezq', 'Venturo', '1722622410631-470271220.png', 'NO', 'guilherme.veiga.pedromilo@venturo.com');

-- --------------------------------------------------------
--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cadastro_empresarial`
--
ALTER TABLE `cadastro_empresarial`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cadastro_empresarial_CNPJ_key` (`CNPJ`),
  ADD UNIQUE KEY `cadastro_empresarial_Empresa_key` (`Empresa`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cadastro_empresarial`
--
ALTER TABLE `cadastro_empresarial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
