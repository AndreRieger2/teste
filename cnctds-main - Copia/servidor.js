import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const FOLDER_ID = process.env.FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'imagem.html'));
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.body.username) {
      return res.status(400).send('No file uploaded or username missing');
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const fileMetadata = {
      name: `${req.body.username}`,
      parents: [FOLDER_ID],
    };
    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    res.redirect('/success.html');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
