import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Error from '../partials/Erro';

// Componentes

// Partials
import EmailPopup from '../partials/e-mail';

const Caixa_Entrada = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [emails, setEmails] = useState([]);
    const [protocoloErro, setProtocoloErro] = useState(null);
    const [msgErro, setMsgErro] = useState(null);

    // E-mail pop-up
    const [isPopupOpen, setPopupOpen] = useState(false);

    const openPopup = () => setPopupOpen(true);
    const closePopup = () => setPopupOpen(false);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserInfo(decodedToken);
            } catch (error) {
                console.error("Invalid token", error);
                navigate("/");
            }
        } else {
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
                try {
                    const response = await axios.get(`http://10.144.165.26:3001/caixa_entrada`, {withCredentials: true});
                        setEmails(response.data);
                } catch (err) {
                    setProtocoloErro("500");
                    setMsgErro("Não foi possível fazer a requisição da sua caixa de entrada");
                }
        }
        fetchData();
    }, []);

    if (protocoloErro) {
        return <Error protocolo={protocoloErro} msg={msgErro} />;
    }

    const Cards = () => (
        <div>
            {emails.length > 0 ? (
                emails.map((email) => (
                    <div key={email.id}>
                        <h3>{email.Assunto}--{email.Remetente}</h3>
                        <p>{email.Mensagem}</p>
                        {!email.Arquivo ? (
                            <div></div>
                        ) : (
                            <a href={`http://10.144.165.26:3001/${email.Arquivo}`}>Arquivo</a>
                        )}
                    </div>
                ))
            ) : (
                <div>Não há mensagens para você</div>
            )}
        </div>
    );

    return (
        <div className='app'>
            <h1>E-mail: Caixa de Entrada</h1>
            <Cards />
            <button onClick={() => navigate('/E-mail_Caixa_Saida')} >Caixa de saida</button>
            <button onClick={openPopup}>Nova Mensagem</button>
            {isPopupOpen && <EmailPopup Email={userInfo.Email} onClose={closePopup} />}
            <button className='btn btn-dark' onClick={() => navigate('/dashboard')} >Voltar</button>
        </div>
    );
};

export default Caixa_Entrada;