import { google } from 'googleapis';
import express from 'express';
import open from 'open';

const app = express();

const CLIENT_ID = '399666542910-6pfgqmahn9iu949bk8l94istppur9g9n.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Gerar a URL de autenticação
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

// Abre a URL no navegador padrão
open(url);

// Rota de callback para capturar o token
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      res.send('Autenticação bem-sucedida! Você pode fechar esta aba.');
      console.log('Refresh Token:', tokens.refresh_token);
    } catch (error) {
      console.error('Erro ao obter o token de acesso', error);
      res.status(500).send('Erro ao obter o token de acesso.');
    }
  } else {
    res.status(400).send('Nenhum código de autorização fornecido.');
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor iniciado em http://localhost:3000');
  console.log('Autorize este aplicativo acessando:', url);
});
