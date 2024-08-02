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

--
-- Despejando dados para a tabela `historico_logs`
--

INSERT INTO `historico_logs` (`id`, `user_id`, `user_name`, `action`, `table_name`, `timestamp`) VALUES
(2, 1, 'Gui', 'Empresa_30 desautorizada', 'cadastro_empresarial', '2024-07-24 15:41:31'),
(3, 1, 'Gui', 'Efetuou o login', 'admin_users', '2024-07-31 10:01:08'),
(4, 6, 'João Pedro', 'Efetuou o login', 'admin_users', '2024-07-31 10:03:08'),
(5, 1, 'Gui', 'Logout', 'admin_users', '2024-07-31 10:11:53'),
(6, 1, 'Gui', 'Efetuou o login', 'admin_users', '2024-07-31 10:12:43'),
(7, 1, 'Gui', 'Logout', 'admin_users', '2024-07-31 10:12:51'),
(8, 6, 'João Pedro', 'Logout', 'admin_users', '2024-07-31 10:13:25'),
(9, 1, 'Gui', 'Efetuou o login', 'admin_users', '2024-07-31 10:20:48'),
(10, 1, 'Gui', 'Logout', '---', '2024-07-31 10:20:56'),
(11, 27, 'Max', 'Efetuou o login', 'cadastro_empresarial', '2024-07-31 10:21:17'),
(12, 0, '', 'Logout', '---', '2024-07-31 10:21:58'),
(13, 1, 'Gui', 'Efetuou o login', 'admin_users', '2024-07-31 10:22:31'),
(14, 1, 'Gui', 'Logout', '---', '2024-07-31 10:22:41'),
(15, 1, 'Gui', 'Efetuou o login', 'admin_users', '2024-07-31 10:23:03'),
(16, 1, 'Gui', 'Logout', '---', '2024-07-31 10:23:10'),
(17, 1, 'Gui06', 'Efetuou o login', 'Funcionario => empresa_27', '2024-07-31 10:23:16'),
(18, 1, 'Gui06', 'Logout', '---', '2024-07-31 10:34:21'),
(19, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 10:34:26'),
(20, 1, 'Gui', 'Desautorizou Empresa_29', 'cadastro_empresarial and DB empresa_29', '2024-07-31 10:34:31'),
(21, 1, 'Gui', 'Autorizou Empresa_29', 'cadastro_empresarial and DB empresa_29', '2024-07-31 10:36:53'),
(22, 1, 'Gui', 'Logout', '---', '2024-07-31 10:37:00'),
(23, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 10:37:04'),
(24, 1, 'Gui', 'Logout', '---', '2024-07-31 10:59:35'),
(25, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 11:03:23'),
(26, 1, 'Gui', 'Autorizou Empresa_31', 'cadastro_empresarial and DB empresa_31', '2024-07-31 11:03:27'),
(27, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 12:12:17'),
(28, 1, 'Gui', 'Desautorizou Empresa_27', 'cadastro_empresarial and DB empresa_27', '2024-07-31 12:15:22'),
(29, 1, 'Gui', 'Desautorizou Empresa_28', 'cadastro_empresarial and DB empresa_28', '2024-07-31 12:15:25'),
(30, 1, 'Gui', 'Desautorizou Empresa_29', 'cadastro_empresarial and DB empresa_29', '2024-07-31 12:15:27'),
(31, 1, 'Gui', 'Desautorizou Empresa_30', 'cadastro_empresarial and DB empresa_30', '2024-07-31 12:15:31'),
(32, 1, 'Gui', 'Logout', '---', '2024-07-31 12:47:44'),
(33, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 12:52:05'),
(34, 1, 'Gui', 'Autorizou Empresa_32', 'cadastro_empresarial and DB empresa_32', '2024-07-31 12:52:07'),
(35, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 15:28:09'),
(36, 1, 'Gui', 'Logout', '---', '2024-07-31 15:29:50'),
(37, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 15:29:54'),
(38, 1, 'Gui', 'Logout', '---', '2024-07-31 15:31:24'),
(39, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 15:31:51'),
(40, 1, 'Gui', 'Logout', '---', '2024-07-31 15:44:28'),
(41, 1, 'Gui', 'Login', 'admin_users', '2024-07-31 15:45:24'),
(42, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 07:26:36'),
(43, 1, 'Gui', 'Logout', '---', '2024-08-02 08:17:35'),
(44, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 08:17:47'),
(45, 1, 'Gui', 'Logout', '---', '2024-08-02 08:41:22'),
(46, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 08:41:25'),
(47, 1, 'Gui', 'Logout', '---', '2024-08-02 08:48:03'),
(48, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 08:48:43'),
(49, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 08:59:09'),
(50, 5, 'Isabella', 'Login', 'admin_users', '2024-08-02 09:08:38'),
(51, 5, 'Isabella', 'Login', 'admin_users', '2024-08-02 09:38:03'),
(52, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 10:11:44'),
(53, 6, 'João Pedro', 'Login', 'admin_users', '2024-08-02 10:24:53'),
(54, 6, 'João Pedro', 'Login', 'admin_users', '2024-08-02 10:26:08'),
(55, 1, 'Gui', 'Logout', '---', '2024-08-02 10:51:28'),
(56, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 10:51:37'),
(57, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 12:22:46'),
(58, 1, 'Gui', 'Logout', '---', '2024-08-02 12:46:05'),
(59, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 12:48:27'),
(60, 1, 'Gui', 'Logout', '---', '2024-08-02 12:48:41'),
(61, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 13:58:15'),
(62, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 14:10:41'),
(63, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 14:53:44'),
(64, 1, 'Gui', 'Logout', '---', '2024-08-02 14:55:21'),
(65, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 14:55:24'),
(66, 6, 'João Pedro', 'Login', 'admin_users', '2024-08-02 15:01:32'),
(67, 6, 'João Pedro', 'Autorizou Empresa_36', 'cadastro_empresarial and DB empresa_36', '2024-08-02 15:04:49'),
(68, 6, 'João Pedro', 'Desautorizou Empresa_36', 'cadastro_empresarial and DB empresa_36', '2024-08-02 15:05:04'),
(69, 6, 'João Pedro', 'Logout', '---', '2024-08-02 15:05:25'),
(70, 1, 'Gui', 'Logout', '---', '2024-08-02 15:09:50'),
(71, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:10:28'),
(72, 1, 'Gui', 'Autorizou Empresa_35', 'cadastro_empresarial and DB empresa_35', '2024-08-02 15:10:33'),
(73, 1, 'Gui', 'Autorizou Empresa_36', 'cadastro_empresarial and DB empresa_36', '2024-08-02 15:11:30'),
(74, 1, 'Gui', 'Logout', '---', '2024-08-02 15:12:58'),
(75, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:13:41'),
(76, 1, 'Gui', 'Autorizou Empresa_37', 'cadastro_empresarial and DB empresa_37', '2024-08-02 15:15:22'),
(77, 1, 'Gui', 'Logout', '---', '2024-08-02 15:20:53'),
(78, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:20:59'),
(79, 1, 'Gui', 'Logout', '---', '2024-08-02 15:23:00'),
(80, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:25:15'),
(81, 1, 'Gui', 'Desautorizou Empresa_35', 'cadastro_empresarial and DB empresa_35', '2024-08-02 15:27:08'),
(82, 1, 'Gui', 'Desautorizou Empresa_36', 'cadastro_empresarial and DB empresa_36', '2024-08-02 15:27:11'),
(83, 1, 'Gui', 'Desautorizou Empresa_37', 'cadastro_empresarial and DB empresa_37', '2024-08-02 15:27:16'),
(84, 1, 'Gui', 'Logout', '---', '2024-08-02 15:27:25'),
(85, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:29:15'),
(86, 1, 'Gui', 'Autorizou Empresa_35', 'cadastro_empresarial and DB empresa_35', '2024-08-02 15:29:17'),
(87, 1, 'Gui', 'Autorizou Empresa_37', 'cadastro_empresarial and DB empresa_37', '2024-08-02 15:29:36'),
(88, 1, 'Gui', 'Desautorizou Empresa_35', 'cadastro_empresarial and DB empresa_35', '2024-08-02 15:29:50'),
(89, 1, 'Gui', 'Logout', '---', '2024-08-02 15:30:11'),
(90, 37, 'Guilherme Veiga Pedromilo', 'Login', 'cadastro_empresarial', '2024-08-02 15:30:22'),
(91, 6, 'João Pedro', 'Login', 'admin_users', '2024-08-02 15:31:37'),
(92, 6, 'João Pedro', 'Logout', '---', '2024-08-02 15:32:27'),
(93, 0, '', 'Logout', '---', '2024-08-02 15:32:45'),
(94, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:32:48'),
(95, 1, 'Gui', 'Desautorizou Empresa_37', 'cadastro_empresarial and DB empresa_37', '2024-08-02 15:32:58'),
(96, 1, 'Gui', 'Logout', '---', '2024-08-02 15:34:00'),
(97, 1, 'Gui', 'Login', 'admin_users', '2024-08-02 15:34:05'),
(98, 1, 'Gui', 'Logout', '---', '2024-08-02 15:35:38');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `historico_logs`
--
ALTER TABLE `historico_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `historico_logs`
--
ALTER TABLE `historico_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
