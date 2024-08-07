import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/email.css'; // Estilos personalizados

const EmailPopup = ({ onClose, Email }) => {
    const [to, setTo] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null); // Adicionado para o arquivo

    // Função para buscar sugestões de e-mail conforme o texto do campo 'Para'
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (to.length > 1) { // Buscar sugestões apenas se houver mais de 1 caractere
                try {
                    const response = await axios.get('http://10.144.165.26:3001/email_suggestions', {
                        params: { query: to },
                        withCredentials: true
                    });
                    setSuggestions(response.data);
                } catch (err) {
                    console.error('Erro ao buscar sugestões de e-mail:', err);
                }
            } else {
                setSuggestions([]);
            }
        };

        fetchSuggestions();
    }, [to]);

    // Função para lidar com a mudança no input de arquivo
    const handleFileChange = (e) => {
        setFile(e.target.files[0]); // Atualiza o estado com o arquivo selecionado
    };

    // Função para enviar o e-mail
    const sendEmail = async () => {
        const formData = new FormData();
        formData.append('Remetente', Email);
        formData.append('Destinatario', to);
        formData.append('Assunto', subject);
        formData.append('Mensagem', message);
        if (file) {
            formData.append('anexo', file); // Adiciona o arquivo ao FormData
        }

        try {
            await axios.post('http://10.144.165.26:3001/email', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Define o cabeçalho para multipart/form-data
                },
                withCredentials: true
            });
            onClose(); // Fechar a popup após o envio
        } catch (err) {
            alert('Erro ao enviar e-mail');
            console.error('Erro ao enviar e-mail:', err);
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup-container">
                <div className="popup-header">
                    <h3>Nova Mensagem</h3>
                    <span className="popup-close" onClick={onClose}>&times;</span>
                </div>
                <div className="popup-body">
                    <input
                        type="text"
                        placeholder="Para"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                    {suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <li key={index} onClick={() => setTo(suggestion)}>
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                    <input
                        type="text"
                        placeholder="Assunto"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                    <textarea
                        placeholder="Mensagem"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <input
                        type="file"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="popup-footer">
                    <button onClick={onClose}>Cancelar</button>
                    <button onClick={sendEmail}>Enviar</button>
                </div>
            </div>
        </div>
    );
};

export default EmailPopup;