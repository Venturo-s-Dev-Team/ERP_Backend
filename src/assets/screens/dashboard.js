import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// TABLES
import TableEmpresas from '../partials/tablesEmpresas';
import TableSuperAdmin from '../partials/tablesSuperAdmins';
import TableEstoque from '../partials/TableEstoque';
import TableFuncionario from '../partials/TableFuncionario';

// Componentes

// Context API
import { useTheme } from '../components/ThemeContext'; // Verifique se o caminho está correto
import { useFontSize } from '../components/FontContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const { DarkMode, AlternarTema } = useTheme();
  const { fontSize, AjustarFonte } = useFontSize();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    console.log('Token from localStorage:', token);
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserInfo(decodedToken);
      } catch (error) {
        console.error("Invalid token", error);
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const jwtTokenEnd = async () => {
    try {
      await axios.get('http://10.144.170.22:3001/logout', { withCredentials: true });
    } catch (err) {
      alert("Erro ao finalizar o token JWT: ", err);
    }
  };

  const localStorageClearLogin = () => {
    try {
      localStorage.removeItem('jwt_token');
    } catch (err) {
      alert("Erro ao limpar o localStorage: ", err);
    }
  };

  const Logout = async () => {
    try {
      await Promise.all([jwtTokenEnd(), localStorageClearLogin()]);
      navigate("/");
    } catch (error) {
      alert("Não foi possível sair da sua conta");
    }
  };

  const Body = () => {
    if (userInfo) {
      if (userInfo.TypeUser === 'SuperAdmin') {
        return (
          <div>
            <p>ID: {userInfo.id_user}</p>
            <p>Nome: {userInfo.Nome_user}</p>
            <TableSuperAdmin />
            <TableEmpresas />
          </div>
        );
      } else if (userInfo.TypeUser === 'Admin') {
        return (
          <div>
            <p>ID: {userInfo.id_user}</p>
            <p>Nome: {userInfo.Nome_user}</p>
            <p>{userInfo.TypeUser}</p>
            <TableEstoque id_user={userInfo.id_EmpresaDb} />
            <TableFuncionario id_user={userInfo.id_EmpresaDb} />
          </div>
        );
      } else if (userInfo.Gestor) {
        return (
          <div>
            <p>ID: {userInfo.ID_Empresa}</p>
            <p>Gestor: {userInfo.Gestor}</p>
            <p>Empresa: {userInfo.Empresa}</p>
            <img src={`http://10.144.170.22:3001/uploads/Logo/${userInfo.Logo}`} alt="Logo" />
            <p>E-mail: {userInfo.Email}</p>
            <TableEstoque id_user={userInfo.ID_Empresa} />
            <TableFuncionario id_user={userInfo.ID_Empresa} />
          </div>
        );
      }
    } else {
      return <p>Carregando...</p>;
    }
  };

  return (
    <div className={`app ${DarkMode ? 'dark' : 'light'} `} style={{ fontSize: `${fontSize}px` }}>
      <h1>Dashboard</h1>
      <Body />

      <button className='btn btn-warning' onClick={AlternarTema}>
        Alternar para {DarkMode ? 'Tema Claro' : 'Tema Escuro'}
      </button>
      <label htmlFor="fontSizeSlider">Tamanho da Fonte: {fontSize}</label>
      <input
        id="fontSizeSlider"
        type="range"
        min="12"
        max="24"
        value={fontSize}
        onChange={(e) => AjustarFonte(e.target.value)}
      />
      <button onClick={() => navigate('/E-mail_Caixa_Entrada')}>E-mail</button>
      <button onClick={() => Logout()} className={`${DarkMode ? 'btn btn-light' : 'btn btn-dark'}`} type='submit'>Logout</button>
    </div>
  );
};

export default Dashboard;
