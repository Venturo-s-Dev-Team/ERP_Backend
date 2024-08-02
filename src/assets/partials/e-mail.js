import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/email.css'; // Estilos personalizados

const EmailPopup = ({ onClose, Email }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchEmailSuggestions = async (query) => {
        if (query.length > 1) {
            try {
                const response = await axios.get(`http://10.144.170.22:3001/email_suggestions`, {
                    params: { query }
                });
                setSuggestions(response.data);
                setShowSuggestions(true);
            } catch (err) {
                console.error('Erro ao buscar sugestões de e-mail', err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const sendEmail = async () => {
        try {
            await axios.post('http://10.144.170.22:3001/email', {
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

    const handleToChange = (e) => {
        const value = e.target.value;
        setTo(value);
        fetchEmailSuggestions(value);
    };

    const handleSuggestionClick = (suggestion) => {
        setTo(suggestion);
        setShowSuggestions(false);
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
                        onChange={handleToChange}
                    />
                    {showSuggestions && (
                        <ul className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
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
