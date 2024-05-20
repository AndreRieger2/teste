import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

// Configuração do multer para lidar com uploads de arquivos
const upload = multer({ dest: 'uploads/' });

const CLIENT_ID = '399666542910-6pfgqmahn9iu949bk8l94istppur9g9n.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const REFRESH_TOKEN = '1//0hnCVS7QAZTtvCgYIARAAGBESNwF-L9Ir7xBzgFAmwL8sH3qkcCAx8RLkfFN65JXfdqoTWSmj4w7aHzthLmzIe8Nt4y8sT-YPkW4';
const FOLDER_ID = '1xFTYZYqlnF7MyUtgivzjxHPnoJNW9m0k'; // Substitua pelo ID da pasta de destino

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileMetadata = {
      name: req.file.originalname,
      parents: [FOLDER_ID], // Define a pasta de destino
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    res.status(200).send(`File uploaded successfully! File ID: ${file.data.id}`);
    // Remove o arquivo temporário após o upload
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
