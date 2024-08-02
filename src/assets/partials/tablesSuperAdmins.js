import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Error from './Erro';

const TableSuperAdmin = () => {
  const [Informacoes, setInformacoes] = useState([]);
  const [protocoloErro, setProtocoloErro] = useState(null);
  const [msgErro, setMsgErro] = useState(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const response = await axios.get('http://10.144.170.22:3001/tableSuperAdmins', { withCredentials: true });
        if (response.status === 200) {
          setInformacoes(response.data.DadosTabela);
        }
      } catch {
        setProtocoloErro("500")
        setMsgErro("Não foi possível fazer a requisição das informações da tabela SuperAdmins")
      }
    };
    fetchDados();
  }, []);

  if (protocoloErro) {
    return <Error protocolo={protocoloErro} msg={msgErro} />;
  }

  return (
    <div>
      <main>
        <div className="container-fluid px-4">
          <h1 className="mt-4">SuperAdmins</h1>
          <div className="card mb-4">
            <div className="card-header">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
            <div className="card-body">
              <table id="InformacoestablesSimple">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>TypeUser</th>
                  </tr>
                </thead>
                <tfoot>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>TypeUser</th>
                  </tr>
                </tfoot>
                <tbody>
                  {Array.isArray(Informacoes) && Informacoes.length > 0 ? (
                    Informacoes.map((item, index) => (
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.Nome}</td>
                        <td>{item.email}</td>
                        <td>{item.TypeUser}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">No records found</td>
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

export default TableSuperAdmin;
