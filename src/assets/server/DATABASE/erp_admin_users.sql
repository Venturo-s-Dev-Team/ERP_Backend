-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 31/07/2024 às 20:36
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

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
