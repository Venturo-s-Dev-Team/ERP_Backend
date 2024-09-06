require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser');
const { mainDb } = require('../../KnexJS/knexfile');
const { createEmpresaKnexConnection } = require('../../KnexJS/MultiSchemas'); // Supondo que há um helper para conexões

const app = express();
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res) => {
  const token = req.cookies.jwt_token;
  const refreshToken = req.cookies.rt_jwt_token;

  if (!token || !refreshToken) {
    console.log("Token não fornecido ou tentativa de invasão")
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ token: token, user: decoded });
  } catch (err) {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Refresh token inválido' });

      let newAccessToken;

      // Verifica o tipo de refreshToken para gerar o novo accessToken corretamente
      if (decoded.Type === 'Main') {
        const user = await mainDb('admin_users').where({ Nome: decoded.Nome_user }).first();

        if (!user) return res.status(401).json({ message: 'Usuário não encontrado' });

        newAccessToken = jwt.sign(
          { id_user: user.id, Nome_user: user.Nome, Email: user.email, TypeUser: user.TypeUser, Refresh: true },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
      } else if (decoded.Type === 'Gestor') {
        const empresa = await mainDb('cadastro_empresarial').where({ Gestor: decoded.Nome_user }).first();

        if (!empresa) return res.status(401).json({ message: 'Empresa não encontrada' });

        newAccessToken = jwt.sign(
          { id_user: empresa.id, Nome_user: empresa.Gestor, RazaoSocial: empresa.RazaoSocial, Logo: empresa.Logo, Email: empresa.email, Status: empresa.Autorizado },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
      } else if (decoded.Type === 'Funcionario') {
        const empresaDb = createEmpresaKnexConnection(`empresa_${decoded.id_EmpresaDb}`);
        const funcionario = await empresaDb('funcionario').where({ Nome: decoded.Nome_user }).first();

        if (!funcionario) return res.status(401).json({ message: 'Funcionário não encontrado' });

        newAccessToken = jwt.sign(
          { id_user: funcionario.id, id_EmpresaDb: funcionario.Empresa, Nome_user: funcionario.Nome, Email: funcionario.email, TypeUser: funcionario.TypeUser },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
      } else {
        return res.status(401).json({ message: 'Tipo de usuário desconhecido' });
      }

      // Atualiza o cookie com o novo accessToken
      res.cookie('jwt_token', newAccessToken, { httpOnly: true, secure: false });
      res.status(200).json({ token: newAccessToken });
      console.log(newAccessToken)
    });
  }
};

module.exports = { verifyToken };