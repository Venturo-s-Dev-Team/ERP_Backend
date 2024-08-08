import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Cadastro = () => {
  const [gestor, setGestor] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [senha, setSenha] = useState('');
  const [logo, setLogo] = useState(null);
  const [erro, setErro] = useState(null);

  const navigate = useNavigate();

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const generateEmail = (name) => {
    return name.toLowerCase().replace(/\s+/g, '.') + '@venturo.com';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const email = generateEmail(gestor);

    const formData = new FormData();
    formData.append('gestor', gestor);
    formData.append('email', email);
    formData.append('cnpj', cnpj);
    formData.append('empresa', empresa);
    formData.append('senha', senha);
    formData.append('logo', logo);

    try {
      const response = await axios.post('http://192.168.0.177:3001/registro', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      if (response.status === 200) {
        navigate('/');
        alert("Cadastro Realizado");
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Estes dados já constam no sistema, insira dados válidos para a validação");
      } else {
        setErro("Não foi possível fazer o registro");
      }
    }
  };

  const handleCnpjChange = (e) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  return (
    <div className='Cadastro'>
      <h1>Cadastro</h1>
      <form onSubmit={handleRegister}>
        <h3>Faça Cadastro</h3>
        <input
          value={gestor}
          onChange={(e) => setGestor(e.target.value)}
          type="text"
          placeholder="Nome"
          name="gestor"
          required
        />
        <input
          value={cnpj}
          onChange={handleCnpjChange}
          type="text"
          placeholder="CNPJ"
          name="cnpj"
          required
        />
        <input
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          type="text"
          placeholder="Nome da empresa"
          name="empresa"
          required
        />
        <input
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          placeholder="Senha"
          name="senha"
          required
        />
        <input
          onChange={(e) => setLogo(e.target.files[0])}
          type="file"
          placeholder="Logo (opcional)"
          name="logo"
        />
        <div>{erro}</div>
        <button className='btn btn-dark' type="submit">Cadastro</button>
      </form>
    </div>
  );
};

export default Cadastro;