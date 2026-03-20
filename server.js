const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const INDEX_PATH = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
    // Servir arquivos estáticos
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    if (filePath === './editar') filePath = './editar.html';

    // Rota de Salvamento
    if (req.url === '/save-permit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                updateHtml(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Servir arquivos
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('Arquivo não encontrado');
            } else {
                res.writeHead(500);
                res.end('Erro no servidor: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

function updateHtml(data) {
    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    // Mapeamento de IDs para os dados recebidos
    // Nota: O permit-plate-header aparece em dois lugares, vamos tratar isso.
    
    for (const [id, value] of Object.entries(data)) {
        if (id === 'permit-plate-header') {
            // Atualizar as duas ocorrências de matrícula no cabeçalho
            const regex1 = new RegExp(`id="permit-plate-header">([^<]*)<`, 'g');
            const regex2 = new RegExp(`id="permit-plate-header-2">([^<]*)<`, 'g');
            html = html.replace(regex1, `id="permit-plate-header">${value}<`);
            html = html.replace(regex2, `id="permit-plate-header-2">${value}<`);
        } else if (id === 'permit-title') {
             const regex1 = new RegExp(`id="permit-title">([^<]*)<`, 'g');
             // Atualizar também a versão em inglês aproximada se desejar, 
             // mas o usuário pediu especificamente "Permit de Passageiros (Regular)"
             html = html.replace(regex1, `id="permit-title">${value}<`);
        } else {
            const regex = new RegExp(`id="${id}">([^<]*)<`, 'g');
            html = html.replace(regex, `id="${id}">${value}<`);
        }
    }

    fs.writeFileSync(INDEX_PATH, html, 'utf8');
    console.log('✓ index.html atualizado com sucesso!');
}

server.listen(PORT, () => {
    console.log(`
==================================================
Servidor Admin de Permit Rodando!
Acesse o formulário em: http://localhost:${PORT}/editar.html
Acesse o Permit em: http://localhost:${PORT}/index.html
==================================================
Pressione Ctrl+C para parar.
`);
});
