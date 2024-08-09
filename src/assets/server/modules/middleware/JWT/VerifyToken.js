require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser'); // Importar cookie-parser

const app = express();
app.use(express.json());
app.use(cookieParser()); // Usar o middleware para lidar com cookies

// Definindo a função verifyToken
const verifyToken = (req, res) => {
    const token = req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ token });
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = {verifyToken}