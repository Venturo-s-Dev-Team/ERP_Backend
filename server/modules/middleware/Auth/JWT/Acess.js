require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser');
const { mainDb } = require('../../../KnexJS/knexfile');
const { createEmpresaKnexConnection } = require('../../../KnexJS/MultiSchemas'); // Supondo que há um helper para conexões

const app = express();
app.use(express.json());
app.use(cookieParser());

const verifyAcess = (req, res, next) => {
  const token = req.cookies.jwt_token;
  const refreshToken = req.cookies.rt_jwt_token;

  if (!token || !refreshToken) {
    console.log("Token não fornecido ou tentativa de invasão");
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Salva os dados do usuário decodificado na requisição
    next(); // Permite que continue para a próxima função (a rota)
  } catch (err) {
    console.log("Token inválido ou expirado");

    // Se o token estiver inválido, você pode adicionar lógica para verificar o refresh token
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

module.exports = { verifyAcess };
