const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

let leiloes = [
    { id: 1, nome: "iPhone 15 Pro", lanceAtual: 4500, imagem: "https://picsum.photos/300/200?random=1" },
    { id: 2, nome: "Macbook Air M2", lanceAtual: 7200, imagem: "https://picsum.photos/300/200?random=2" }
];

// Quando um usuário se conecta
io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);
});

// Rota de listagem
app.get('/api/leiloes', (req, res) => res.json(leiloes));

// Rota de lance (Atualizada para emitir evento socket)
app.post('/api/lance', (req, res) => {
    const { id, valor } = req.body;
    const item = leiloes.find(l => l.id === id);

    if (item && valor > item.lanceAtual) {
        item.lanceAtual = valor;
        // AVISA TODO MUNDO QUE O PREÇO MUDOU
        io.emit('atualizarLance', { id: item.id, novoValor: item.lanceAtual });
        return res.json({ success: true });
    }
    res.status(400).json({ success: false });
});

app.post('/api/novo-item', (req, res) => {
    const { nome, precoInicial, imagem } = req.body;
    const novo = {
        id: leiloes.length + 1,
        nome,
        lanceAtual: parseFloat(precoInicial),
        imagem: imagem || "https://picsum.photos/300/200?random=" + Math.random()
    };
    leiloes.push(novo);
    io.emit('novoItemAdicionado', novo); // Avisa que tem item novo na vitrine
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
