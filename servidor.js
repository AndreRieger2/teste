import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { readFile } from 'fs/promises'; // Importe esta linha se não estiver usando Node.js 14 ou superior

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Carregar as credenciais do token de serviço
const credentials = await readFile('/cnctds.json');
const { client_email, private_key } = JSON.parse(credentials);

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email,
    private_key,
  },
  scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

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
        res.status(999).send('Error uploading file');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
