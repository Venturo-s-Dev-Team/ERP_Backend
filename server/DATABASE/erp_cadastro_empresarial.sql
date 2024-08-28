-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16/08/2024 às 20:44
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

--
-- Despejando dados para a tabela `cadastro_empresarial`
--

INSERT INTO `cadastro_empresarial` (`id`, `RazaoSocial`, `CNPJ`, `InscricaoEstadual`, `Municipio`, `UF`, `Logradouro`, `Numero`, `CEP`, `Complemento`, `email`, `Telefone`, `Site`, `Gestor`, `Senha`, `CPF`, `RG`, `ContratoSocial`, `RequerimentoEmpresario`, `CertificadoMEI`, `Logo`, `Autorizado`) VALUES
(1, 'CLASSIC GUITARS', '12.030.129/4109-10', '393.984.903.829', 'oivsvs', 'fw', '904hwefjwefwei', '2340', '32904-823', 'weiofwioefiowe', 'caetano.vel@venturo.com', '(32)84023-9842', '', 'Caetano Vel', '$2b$10$dSZAKwD23.x07wKZSKqE5ea9FHkCsb35eVR75IdLQIIP5t7h6PuO6', '238.029.384-90', '32.085.230-8', 'uploads\\Docs\\CadastroEmpresas\\1723809715902-Briefing_Venturo.pdf', 'uploads\\Docs\\CadastroEmpresas\\1723809715904-Briefing_Venturo.pdf', 'uploads\\Docs\\CadastroEmpresas\\1723809715910-Briefing_Venturo.pdf', '1.jpg', 'NO'),
(2, 'Montanhas seguras', '12.048.102/4801-01', '012.981.209.381', 'Cidadela', 'AC', 'Amazônia', '1421', '21421-421', 'Montanha', 'tony.montanha@venturo.com', '(12)03120-8120', 'https://pt.wikipedia.org/wiki/Montanha', 'Tony Montanha', '$2b$10$rwgX.EhgXEF0yu7hA/UdWus8yjwDyZ8.RAokT.7.ViKzXj5br6W.C', '298.429.048-20', '21.980.921-8', '1723812584913-516432976-Briefing_Venturo.pdf', '1723812584915-328821697-Briefing PROJETO-PIXEL BANK.pdf', '1723812584924-352922742-SA1 â Atividade 2 â Desafio 1.1 â Plano de trabalho.pdf', '2.jpg', 'NO'),
(3, 'Trens Saint-Denis', '01.284.092/3402-38', '348.238.230.922', 'iirowhfiow1\'', 'sp', 'wiefhio', '2423', '21424-234', 'wifowqio', 'arthur.morgana@venturo.com', '(21)31242-1411', '', 'Arthur Morgana', '$2b$10$0dYHzxpX/wLZCsTkuWJRYOtfi5SrN1CL2GaPo5Mo6YrIM3imoIBTq', '312.414.214-24', '23.423.423-4', '1723813778526-754701202-AnuÃ¡rio Mineral Brasileiro Principais SubstÃ¢ncias MetÃ¡licas 2022.pdf', '1723813778638-712369681-Briefing_Venturo.pdf', '1723813778640-650469759-GOOGLE CLOUD AI.pdf', '3.jpg', 'NO'),
(4, 'LSCustoms', '44.444.444/4444-44', '544.818.181.515', '5', 'as', 'afsa', '444_', '13380-070', '212', 'joão.preto@venturo.com', '(11)32121-2121', '', 'João Preto', '$2b$10$BvkkHVCpYmAi7Rl3k6AtI.iDr1pd7EHxlnewAHohc.crBRh5xJuFm', '145.151.515-15', '15.545.454-5', '1723822708646-964325871-nota_fiscal (6).pdf', '1723822708702-910357243-nota_fiscal (5).pdf', '1723822708726-389292298-nota_fiscal (4).pdf', '4.png', 'YES'),
(5, 'ameinda', '12.345.678/9', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ameinda@venturo.com', NULL, NULL, 'ameinda', '$2b$10$cKRaJ6ZEAx5pm5ZCzj3fFOI5prGyLGxwK7wreJUvgrKsEscj3NHYG', NULL, NULL, NULL, NULL, NULL, '5.jpg', 'NO'),
(6, 'vaticano', '55.555.555/5555-55', '666.666.666.666', 'inferno', 'je', 'setimo circulo', '666_', '77777-777', 'luan', 'brinidro@venturo.com', '(19)99999-9999', '', 'Brinidro', '$2b$10$zo0rAJJVCxSo8DJ/wAx/w.Iv4gWoBwk2eL.lMGEmaDLvzviDH4HBm', '222.222.222-22', '11.111.111-1', '1723826480703-374562733-2023_PV_impresso_D1_CD1.pdf', '1723826481032-680654795-2023_PV_impresso_D1_CD1.pdf', '1723826481229-805589229-2023_PV_impresso_D1_CD1.pdf', '6.png', 'YES'),
(11, 'jerusalem', '11.111.111/1111-11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'lucifer@venturo.com', NULL, NULL, 'lucifer', '$2b$10$BRfhX7qddeOO2hbcDLPphejLyDnk.HA9gLYXhRJudr8M7b4BWLvoG', NULL, NULL, NULL, NULL, NULL, '11.pdf', 'NO');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cadastro_empresarial`
--
ALTER TABLE `cadastro_empresarial`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `CNPJ` (`CNPJ`),
  ADD UNIQUE KEY `Email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cadastro_empresarial`
--
ALTER TABLE `cadastro_empresarial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
