import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Correção do import

// Context API
import { useFontSize } from '../components/FontContext';

// TABLES
import TableEstoque from '../partials/TableEstoque';
import TableFuncionario from '../partials/TableFuncionario';

const EmpresaInfo = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [empresaInfo, setEmpresaInfo] = useState(null);
  const { fontSize } = useFontSize();

  useEffect(() => {
    // Obtenha o token do localStorage e decodifique-o para obter as informações do usuário
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserInfo(decodedToken);
      } catch (error) {
        console.error("Erro ao decodificar o token", error);
      }
    } else {
      navigate("/");
    }

    // Obtenha as informações da empresa do localStorage
    const info = localStorage.getItem('InfoEmpresa');
    if (info) {
      try {
        const parsedInfo = JSON.parse(info);
        setEmpresaInfo(parsedInfo[0]); // Supondo que seja um array e queremos o primeiro item
      } catch (error) {
        console.error("Erro ao parsear InfoEmpresa", error);
      }
    } else {
      alert('Não foi possível carregar as informações');
      navigate('/dashboard');
    }
  }, [navigate]);

  const Body = () => {
    if (empresaInfo) {
      return (
        <div>
          <TableEstoque id_user={empresaInfo.id} />
          <TableFuncionario id_user={empresaInfo.id} />
        </div>
      );
    } else {
      return <p>Carregando...</p>;
    }
  };

  const Back = () => {
    localStorage.removeItem('InfoEmpresa');
    navigate('/dashboard');
  };

  return (
    <div className='app' style={{ fontSize: `${fontSize}px` }}>
      {userInfo && (
        <>
          <h1>{userInfo.Nome_user}, veja as informações da Empresa_{empresaInfo.id}</h1>
          <Body />
          <button className='btn btn-dark' onClick={Back}>Voltar</button>
        </>
      )}
    </div>
  );
};

export default EmpresaInfo;