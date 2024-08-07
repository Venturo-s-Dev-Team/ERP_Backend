import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Error from './Erro';

const TableEmpresas = () => {
  const [Data, setData] = useState([]);
  const [protocoloErro, setProtocoloErro] = useState(null);
  const [msgErro, setMsgErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const Info = await axios.get('http://10.144.165.26:3001/tableEmpresas', { withCredentials: true });
        if (Info.status === 200) {
          setData(Info.data.InfoTabela);
        }
      } catch (err) {
        console.error("Erro: ", err);
        setProtocoloErro("500");
        setMsgErro("Não foi possível fazer a requisição das informações da tabela SuperAdmins");
      }
    };
    fetchData();
  }, []);

  const Desautorizado = async (id) => {
    try {
      const response = await axios.get(`http://10.144.165.26:3001/desautorizar/${id}`, { withCredentials: true });
      if (response) {
        alert("Empresa desautorizada. A página será recarregada.");
        window.location.reload(); // Recarrega a página
      }
    } catch (err) {
      console.error("Erro: ", err);
      setProtocoloErro("500");
      setMsgErro("Não foi possível fazer a desautorização");
    }
  };

  const Autorizado = async (id) => {
    try {
      const response = await axios.get(`http://10.144.165.26:3001/autorizar/${id}`, { withCredentials: true });
      if (response) {
        alert("Empresa autorizada. A página será recarregada.");
        window.location.reload(); // Recarrega a página
      }
    } catch (err) {
      console.error("Erro: ", err);
      setProtocoloErro("500");
      setMsgErro("Não foi possível fazer a autorização");
    }
  };

  const EmpresaInfo = async (id) => {
    try {
      const response = await axios.get(`http://10.144.165.26:3001/SelectInfoEmpresa/${id}`, { withCredentials: true });
      if (response && response.data && response.data.InfoEmpresa) {
        const Info = response.data.InfoEmpresa;
        console.log('InfoEmpresa from API:', Info);
        localStorage.setItem('InfoEmpresa', JSON.stringify(Info)); // Armazena o objeto como JSON
        navigate('/empresaInfo');
      } else {
        alert('Não foi possível fazer a requisição das informações');
      }
    } catch (error) {
      alert('Não foi possível fazer a requisição das informações');
      console.log(error);
    }
  };


  if (protocoloErro) {
    return <Error protocolo={protocoloErro} msg={msgErro} />;
  }

  console.log(Data.Logo)
  
  return (
    <div>
      <main>
        <div className="container-fluid px-4">
          <h1 className="mt-4">Empresas</h1>
          <div className="card mb-4">
            <div className="card-header">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
            <div className="card-body">
              <table id="datatablesSimple">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>CNPJ</th>
                    <th>Gestor</th>
                    <th>Empresa</th>
                    <th>Endereço</th>
                    <th>Logo</th>
                    <th>Autorizado</th>
                    <th>Database (Veja info.)</th>
                  </tr>
                </thead>
                <tfoot>
                  <tr>
                    <th>ID</th>
                    <th>CNPJ</th>
                    <th>Gestor</th>
                    <th>Empresa</th>
                    <th>Endereço</th>
                    <th>Logo</th>
                    <th>Autorizado</th>
                    <th>Database (Veja info.)</th>
                  </tr>
                </tfoot>
                <tbody>
                  {Array.isArray(Data) && Data.length > 0 ? (
                    Data.map((item, index) => (
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.CNPJ}</td>
                        <td>{item.Gestor}</td>
                        <td>{item.Empresa}</td>
                        <td>{item.email}</td>
                        <td>{!item.Logo ? (
                        <div>Vazio</div>
                        ) : (
                        <img src={`http://10.144.165.26:3001/uploads/Logo/${item.Logo}`} style={{ width: 100, height: 100 }} alt="" />
                        )}
                        </td>
                        <td>
                          {item.Autorizado === "YES" ? (
                            <button className="btn btn-danger" onClick={() => Desautorizado(item.id)} type="button">Desautorizar</button>
                          ) : (
                            <button className="btn btn-primary" onClick={() => Autorizado(item.id)} type="button">Autorizar</button>
                          )}
                        </td>
                        <td>
                          {item.Autorizado === "YES" ? (
                            <button className='btn btn-info' onClick={() => EmpresaInfo(item.id)} >empresa_{item.id}</button>
                          ) : (
                            <div>Acess Denied (500)</div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TableEmpresas;
