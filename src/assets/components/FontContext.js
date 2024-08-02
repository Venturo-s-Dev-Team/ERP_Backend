import React, { createContext, useState, useContext } from 'react';

// Cria o contexto
const FontSizeContext = createContext();

// Provedor do contexto
export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(16); // Tamanho da fonte inicial em pixels

  const AjustarFonte = (NovoTamanho) => {
    setFontSize(NovoTamanho);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, AjustarFonte }}>
      {children}
    </FontSizeContext.Provider>
  );
};

// Hook para usar o contexto do tamanho da fonte
export const useFontSize = () => useContext(FontSizeContext);
