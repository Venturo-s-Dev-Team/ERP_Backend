import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Error from './Erro';

const TableEstoque = (props) => {
  const [informacoes, setInformacoes] = useState([]);
  const [protocoloErro, setProtocoloErro] = useState(null);
  const [msgErro, setMsgErro] = useState(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const response = await axios.get(`http://192.168.0.177:3001/tableEstoque/${props.id_user}`, { withCredentials: true });
        if (response.status === 200) {
          setInformacoes(response.data.InfoTabela);
        }
      } catch (error) {
        setProtocoloErro("500");
        setMsgErro("Não foi possível fazer a requisição das informações da tabela Estoque");
      }
    };
    fetchDados();
  }, [props.id_user]); // Adicionando props.id_user como dependência
  

  if (protocoloErro) {
    return <Error protocolo={protocoloErro} msg={msgErro} />;
  }

  return (
    <div>
      <main>
        <div className="container-fluid px-4">
          <h1 className="mt-4">Estoque</h1>
          <div className="card mb-4">
            <div className="card-header">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
            <div className="card-body">
              <table id="infoTabelaSimple">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Código</th>
                    <th>Quantidade</th>
                    <th>ValorUnitario</th>
                    <th>Estoque</th>
                  </tr>
                </thead>
                <tfoot>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Código</th>
                    <th>Quantidade</th>
                    <th>ValorUnitario</th>
                    <th>Estoque</th>
                  </tr>
                </tfoot>
                <tbody>
                  {Array.isArray(informacoes) && informacoes.length > 0 ? (
                    informacoes.map((item, index) => (
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.Nome}</td>
                        <td>{item.Codigo}</td>
                        <td>{item.Quantidade}</td>
                        <td>{item.ValorUnitario}</td>
                        <td>{item.Estoque}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">Nenhum registro encontrado</td>
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

export default TableEstoque;
