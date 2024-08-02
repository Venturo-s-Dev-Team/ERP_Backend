import React from 'react';

const Error = (props) => {

  return (
    <div>
      <h1>ERRO</h1>
      <p>Status: {props.protocolo} </p>
      <p>Mensagem: {props.msg}</p>
    </div>
  );
};

export default Error;
