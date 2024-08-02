import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
    const [DarkMode, setDarkMode] = useState(false);

    const AlternarTema = () => {
        setDarkMode(!DarkMode);
    };

    useEffect(() => {
        document.body.className = DarkMode ? 'dark' : 'light';
    }, [DarkMode]);

    return (
        <ThemeContext.Provider value={{ DarkMode, AlternarTema }}>
            {children}
        </ThemeContext.Provider>
    );
};

const useTheme = () => useContext(ThemeContext);

export { ThemeProvider, useTheme };
