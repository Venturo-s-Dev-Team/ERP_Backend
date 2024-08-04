import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/email.css'; // Estilos personalizados

const EmailPopup = ({ onClose, Email }) => {
    const [to, setTo] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (to.length > 1) { // Buscar sugestões apenas se houver mais de 1 caractere
                try {
                    const response = await axios.get('http://192.168.0.178:3001/email_suggestions', {
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

    const sendEmail = async () => {
        try {
            await axios.post('http://192.168.0.178:3001/email', {
                Remetente: Email,
                Destinatario: to,
                Assunto: subject,
                Mensagem: message
            }, { withCredentials: true });
            onClose(); // Fechar a popup após o envio
        } catch (err) {
            alert('Erro ao enviar e-mail');
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
