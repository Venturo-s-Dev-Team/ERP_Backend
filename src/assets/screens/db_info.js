import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import corrigido, sem desestruturação

// Context API
import { useFontSize } from '../components/FontContext';

// TABLES
import TableEstoque from '../partials/TableEstoque';
import TableFuncionario from '../partials/TableFuncionario';

const EmpresaInfo = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState('');
  const [empresaInfo, setEmpresaInfo] = useState('');
  const { fontSize, } = useFontSize();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    console.log('Token from localStorage:', token);
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', decodedToken);
        setUserInfo(decodedToken);

        const info = localStorage.getItem('InfoEmpresa');
        console.log('InfoEmpresa from localStorage:', info);
        if (info) {
          const parsedInfo = JSON.parse(info); // Parse JSON
          console.log('Parsed InfoEmpresa:', parsedInfo);
          setEmpresaInfo(parsedInfo[0]); // Assuming it's an array and we need the first item
        } else {
          alert('Não foi possível carregar as informações');
          navigate('/dashboard')
        }
      } catch (error) {
        console.error("Error decoding token or parsing InfoEmpresa", error);
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const Body = () => {
    if (userInfo) {
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
    try {
      localStorage.removeItem('InfoEmpresa')
      navigate('/dashboard')
    } catch {
      alert('Erro')
    }
  }

  return (
    <div className='app' style={{ fontSize: `${fontSize}px` }}>
      <h1>{userInfo.Nome_user}, veja as informações da Empresa_{empresaInfo.id}</h1>
      <Body />
      <button className='btn btn-dark' onClick={() => Back()} >Voltar</button>
    </div>
  );
};

export default EmpresaInfo;
