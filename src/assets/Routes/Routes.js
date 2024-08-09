import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "../screens/login";
import Dashboard from "../screens/dashboard";
import EmpresaInfo from "../screens/db_info";
import Caixa_Entrada from "../screens/Email_Caixa_Entrada";
import Caixa_Saida from "../screens/E-mail_Caixa_Saida";

import { ThemeProvider } from "../components/ThemeContext";
import { FontSizeProvider } from "../components/FontContext";


const AppRoutes = () => {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/empresaInfo" element={<EmpresaInfo />} />
            <Route path="/E-mail_Caixa_Entrada" element={<Caixa_Entrada />} />
            <Route path="/E-mail_Caixa_Saida" element={<Caixa_Saida />} />
          </Routes>
        </Router>
      </FontSizeProvider>
    </ThemeProvider>
  );
};

export default AppRoutes;