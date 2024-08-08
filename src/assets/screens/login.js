import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cadastro from '../partials/cadastro';
import Error from '../partials/Erro';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [protocoloErro, setProtocoloErro] = useState(null);
  const [msgErro, setMsgErro] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://192.168.0.177:3001/login', {
        Nome: nome,
        Senha: senha
      }, { withCredentials: true });

      if (response.status === 200) {
        const token = response.data.token;
        localStorage.setItem('jwt_token', token);
        navigate('/dashboard');
      } else {
        alert("Usuário desconhecido");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 403) {
          setProtocoloErro("403");
          setMsgErro("Esta empresa não está autorizada");
        } else if (error.response.status === 401) {
          setErro("Credenciais inválidas");
        } else {
          setProtocoloErro("500");
          setMsgErro("Ocorreu um erro. Tente novamente mais tarde.");
        }
      } else {
        setProtocoloErro("500");
        setMsgErro("Ocorreu um erro. Tente novamente mais tarde.");
      }
    }
  };

  if (protocoloErro) {
    return <Error protocolo={protocoloErro} msg={msgErro} />;
  }

  return (
    <div className='Login'>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <h3>Faça Login</h3>
        <input
          id="Nome"
          name="Nome"
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          id="Senha"
          name="Senha"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <div>{erro}</div>
        <button className='btn btn-dark' type="submit">Login</button>
        <a href="/dashboard">Esqueceu sua senha?</a>
      </form>
      <Cadastro />
    </div>
  );
};

export default Login;
