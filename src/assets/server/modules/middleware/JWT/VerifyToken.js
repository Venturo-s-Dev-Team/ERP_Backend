require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser'); // Importar cookie-parser
const { mainDb } = require('../../KnexJS/knexfile');

const app = express();
app.use(express.json());
app.use(cookieParser()); // Usar o middleware para lidar com cookies

// Definindo a função verifyToken
const verifyToken = (req, res) => {
    const token = req.cookies.jwt_token;
    const refreshToken = req.cookies.rt_jwt_token;
  
    if (!token || !refreshToken) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.status(200).json({ token: token, user: decoded });
    } catch (err) {
      // Token expirado, tentar usar o refresh token
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Refresh token inválido' });
  
        // Buscar usuário com base no ID do refresh token
        const user = await mainDb('admin_users').where({ Nome: decoded.Nome_user }).first();
  
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado' });
  
        // Gerar novo access token
        const newAccessToken = jwt.sign(
          { id_user: user.id, Nome_user: user.Nome, Email: user.email, TypeUser: user.TypeUser, Refresh: true },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        console.log(newAccessToken)
  
        res.cookie('jwt_token', newAccessToken, { httpOnly: true, secure: false });
        res.status(200).json({ token: newAccessToken });
      });
    }
  };
  

module.exports = {verifyToken}