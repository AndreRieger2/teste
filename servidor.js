import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

// Carregar dotenv apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
}

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
const SHEET_ID = process.env.SHEET_ID;  // ID da planilha do Google Sheets
const FOLDER_ID = process.env.FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).send('No file uploaded');
        }

        console.log('Form data received:', req.body);

        const formData = req.body;
        const nomeCompleto = formData.Nome;
        if (!nomeCompleto) {
            console.error('Nome completo não fornecido');
            return res.status(400).send('Nome completo não fornecido');
        }

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        const fileMetadata = {
            name: nomeCompleto,
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

          const sheetData = [
            formData.Nome,
            formData.Email,
            formData.Telefone,
            formData.Data,
            formData.Sexo,
            formData.Lider,
            formData.Cidade,
            file.data.id
        ];

        console.log('Sheet data to append:', sheetData);

        // Debug: Verificando os valores de SHEET_ID e range
        console.log('SHEET_ID:', SHEET_ID);
        console.log('Range: Inscrições!A1');

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Inscrições!A1', // Ajuste para o intervalo adequado
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [sheetData],
            },
        });

        res.redirect('/success.html');
    } catch (error) {
        console.error('Error uploading file:', error.message);
        if (error.response && error.response.data) {
            console.error('Google API error details:', error.response.data);
        }
        res.status(500).send('Error uploading file');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
