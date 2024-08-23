require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { mainDb } = require('./modules/KnexJS/knexfile'); // Configurações do Knex 
const { createEmpresaKnexConnection } = require('./modules/KnexJS/MultiSchemas') // Configurações da conexão dinâmica com o banco da empresa
const { checkIfDatabaseExists } = require('./modules/middleware/MYSQL/CheckIfDatabaseExists') // Verifica se tem um banco de dados existente
const { copyDatabase } = require('./modules/Functions/MYSQL/CopyDatabase'); // Copia o banco de dados
const { createConnection } = require('./modules/KnexJS/CreateConnectionMultipleStatements'); // Cria uma conexxão sql MultipleStatements = true
const { verifyToken } = require('./modules/middleware/JWT/VerifyToken')
const { logAction } = require('./modules/Functions/LOGS/LogAction_db'); // Função de Logs
const { logActionEmpresa } = require('./modules/Functions/LOGS/LogAction_db_empresas');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs')

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
    origin: `${process.env.IP_FRONT_END}`, // Permitir o IP do front-end
    credentials: true
}));

// Servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/Logo', express.static(path.join(__dirname, 'Logo')));
app.use('/uploads/ProdutosIMG', express.static(path.join(__dirname, 'ProdutosIMG')));

// LOGIN - JWT - CADASTRO_EMPRESARIAL - LOGOUT

// Rota para login
app.post('/login', async (req, res) => {
    const { Nome, Senha } = req.body; // Obtendo id, Nome e Senha do corpo da requisição.

    try {
        // Busca usuário/SuperAdministrador pelo Nome no banco principal
        const user = await mainDb('admin_users').where({ Nome }).first();

        if (user) {
            // Verifica a senha criptografada do usuário com o bcrypt.
            const isPasswordValid = await bcrypt.compare(Senha, user.Senha);
            if (isPasswordValid) {
                // Gera o token JWT se a senha for válida.
                const token = jwt.sign(
                    { id_user: user.id, Nome_user: user.Nome, Email: user.email, TypeUser: user.TypeUser, },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' } // Token expira em 15 minutos.
                );

                // Gera o refresh token.
                const refreshToken = jwt.sign(
                    { id_user: user.id, Nome_user: user.Nome, Type: 'Main', },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: '7d' } // Refresh token expira em 7 dias.
                );

                // Registra log de login bem-sucedido
                await logAction(user.id, user.Nome, 'Login', 'admin_users');
                // Configura o cookie com o token JWT.
                res.cookie('jwt_token', token, { httpOnly: true, secure: false });
                res.cookie('rt_jwt_token', refreshToken, { httpOnly: true, secure: false });
                res.status(200).send({ token }); // Token é enviado para o front-end
            } else {
                res.status(401).send('Credenciais inválidas'); // Senha inválida.
            }
        } else {
            // Busca empresa pelo Nome no banco principal
            const empresa = await mainDb('cadastro_empresarial').where({ Gestor: Nome }).first();

            if (empresa) {
                // Verifica a senha da empresa com bcrypt.
                const isPasswordValid2 = await bcrypt.compare(Senha, empresa.Senha);
                if (isPasswordValid2) {

                    // Verifica se há valores nulos em qualquer propriedade do objeto empresa, exceto em empresa.Logo e empresa.Site
                    const ValoresNulosObtidos = Object.keys(empresa).some(key => {
                        return key !== 'Logo' && key !== 'Site' && empresa[key] === null;
                    });


                    // Gera o token JWT se a senha for válida.
                    const token = jwt.sign(
                        { id_user: empresa.id, Nome_user: empresa.Gestor, RazaoSocial: empresa.RazaoSocial, Logo: empresa.Logo, Email: empresa.email, Status: empresa.Autorizado, ValoresNull: ValoresNulosObtidos },
                        process.env.JWT_SECRET,
                        { expiresIn: '15m' } // Token expira em 15 minutos.
                    );

                    // Gera o refresh token.
                    const refreshToken = jwt.sign(
                        { id_user: empresa.id, Nome_user: empresa.Gestor, Type: 'Gestor', Status: empresa.Autorizado },
                        process.env.REFRESH_TOKEN_SECRET,
                        { expiresIn: '7d' } // Refresh token expira em 7 dias.
                    );
                    // Configura o cookie com o token JWT.
                    res.cookie('jwt_token', token, { httpOnly: true, secure: false });
                    res.cookie('rt_jwt_token', refreshToken, { httpOnly: true, secure: false });
                    // Registra log de login bem-sucedido
                    await logAction(empresa.id, empresa.Gestor, 'Login', 'cadastro_empresarial');
                    await logActionEmpresa(empresa.id, empresa.id, empresa.Gestor, 'Login', 'erp.cadastro_empresarial')
                    // Conectar ao banco de dados da empresa específica.
                    const empresaDb = createEmpresaKnexConnection(`empresa_${empresa.id}`);
                    req.empresaDb = empresaDb;
                    res.status(200).send({ token }); // Envia o token para o front-end
                } else {
                    res.status(401).send('Credenciais inválidas'); // Senha inválida.
                }
            } else {
                // Caso não seja administrador nem empresa, verificar em todas as empresas para funcionários.
                const empresas = await mainDb('cadastro_empresarial').select('id'); // Seleciona todos os id da tabela do banco principal
                let funcionario;
                let empresaId;

                for (const empresa of empresas) {
                    const databaseName = `empresa_${empresa.id}`;
                    console.log(databaseName);

                    // Verifica se o banco de dados da empresa está ativo e existe
                    const databaseExists = await checkIfDatabaseExists(databaseName);

                    if (!databaseExists) {
                        continue; // Continue para o próximo banco de dados se o atual não existir
                    }

                    const empresaDb = createEmpresaKnexConnection(databaseName);
                    const tableName = 'Funcionario'; // Nome da tabela no banco da empresa
                    funcionario = await empresaDb(tableName).where({ Nome }).first();

                    if (funcionario) {
                        empresaId = empresa.id;
                        break; // Sai do loop se o funcionário for encontrado
                    }
                }

                if (funcionario) {
                    // Verifica a senha do funcionário.
                    const isPasswordValid = await bcrypt.compare(Senha, funcionario.Senha);
                    if (isPasswordValid) {
                        // Gera o token JWT se a senha for válida.
                        const token = jwt.sign(
                            { id_user: funcionario.id, id_EmpresaDb: funcionario.Empresa, Nome_user: funcionario.Nome, Email: funcionario.email, TypeUser: funcionario.TypeUser, isUser: true },
                            process.env.JWT_SECRET,
                            { expiresIn: '15m' } // Token expira em 15 minutos.
                        );

                        // Gera o refresh token.
                        const refreshToken = jwt.sign(
                            { id_user: funcionario.id, Nome_user: funcionario.Nome, id_EmpresaDb: funcionario.Empresa, Type: 'Funcionario', },
                            process.env.REFRESH_TOKEN_SECRET,
                            { expiresIn: '7d' } // Refresh token expira em 7 dias.
                        );
                        // Registra log de login bem-sucedido
                        await logActionEmpresa(funcionario.Empresa, funcionario.id, funcionario.Nome, 'Login', 'Funcionario')
                        // Configura o cookie com o token JWT.
                        res.cookie('jwt_token', token, { httpOnly: true, secure: false });
                        res.cookie('rt_jwt_token', refreshToken, { httpOnly: true, secure: false });
                        res.status(200).send({ token }); // Envia o token para o front-end
                    } else {
                        res.status(401).send('Credenciais inválidas'); // Senha inválida.
                    }
                } else {
                    res.status(401).send('Credenciais inválidas'); // Usuário não encontrado.
                }
            }
        }
    } catch (err) {
        console.error("Erro ao fazer login:", err); // Log detalhado.
        res.status(500).send("Não foi possível fazer a requisição");
    }
});

// JWT

// Usando a função verifyToken na rota
app.get('/verifyToken', verifyToken);

//CADASTRO_EMPRESARIAL

// Registro das empresas
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/Logo');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/registro', upload.single('Logo'), async (req, res) => {
    const { RazaoSocial, CNPJ, Gestor, Email, senha } = req.body;

    try {
        let logoFilename = null;
        if (req.file) {
            logoFilename = req.file.filename;
        }

        const existingCompanyByName = await mainDb('cadastro_empresarial').where({ RazaoSocial }).first();
        if (existingCompanyByName) {
            return res.status(409).send({ errorCode: 409, message: "Empresa já registrada" });
        }

        const existingCompanyByCnpj = await mainDb('cadastro_empresarial').where({ CNPJ }).first();
        if (existingCompanyByCnpj) {
            return res.status(409).send({ errorCode: 409, message: "CNPJ já registrado" });
        }

        const hashedSenha = await bcrypt.hash(senha, 10);

        const [createdCompanyId] = await mainDb('cadastro_empresarial').insert({
            RazaoSocial,
            CNPJ,
            Logo: logoFilename,
            Gestor,
            Email,
            Senha: hashedSenha
        }).returning('id'); // Supondo que 'id' é o nome da coluna do ID

        if (logoFilename) {
            const newLogoFilename = `${createdCompanyId}${path.extname(logoFilename)}`;
            const oldPath = path.join('uploads/Logo', logoFilename);
            const newPath = path.join('uploads/Logo', newLogoFilename);

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error('Erro ao renomear o arquivo:', err);
                    return res.status(500).send({ errorCode: 500, message: "Não foi possível renomear o arquivo da logo" });
                }

                // Atualiza o nome do arquivo no banco de dados
                mainDb('cadastro_empresarial')
                    .where({ id: createdCompanyId })
                    .update({ Logo: newLogoFilename })
                    .then(() => {
                        res.sendStatus(200);
                        console.log('Cadastrado com sucesso empresa: ', createdCompanyId);
                    })
                    .catch(updateErr => {
                        console.error('Erro ao atualizar o nome do arquivo no banco de dados:', updateErr);
                        res.status(500).send({ errorCode: 500, message: "Não foi possível atualizar o nome do arquivo no banco de dados" });
                    });
            });
        } else {
            res.sendStatus(200);
            console.log('Cadastrado com sucesso: ', createdCompanyId);
        }
    } catch (err) {
        console.log('Erro ao registrar empresa:', err);
        return res.status(500).send({ errorCode: 500, message: "Não foi possível fazer o registro" });
    }
});

app.get('/logout', async (req, res) => {
    // Obtendo informações do usuário do token (exemplo)
    const token = req.cookies.jwt_token;
    const refreshToken = req.cookies.rt_jwt_token

    // Limpar o token JWT do cliente
    res.clearCookie('jwt_token', 'rt_jwt_token');
    console.log('Usuário desconectado');

    res.sendStatus(200);
});

app.listen(3002, () => {
    console.log('Server two listening on port 3002');
});