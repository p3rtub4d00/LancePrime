const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// Itens com tempo inicial em segundos (ex: 600 = 10 minutos)
let leiloes = [
    { id: 1, nome: "iPhone 15 Pro", lanceAtual: 4500, imagem: "https://picsum.photos/300/200?random=1", tempo: 600, ativo: true },
    { id: 2, nome: "Macbook Air M2", lanceAtual: 7200, imagem: "https://picsum.photos/300/200?random=2", tempo: 300, ativo: true },
    { id: 3, nome: "PlayStation 5", lanceAtual: 3100, imagem: "https://picsum.photos/300/200?random=3", tempo: 120, ativo: true }
];

// Lógica do Cronómetro no Servidor
setInterval(() => {
    leiloes.forEach(item => {
        if (item.ativo && item.tempo > 0) {
            item.tempo--;
            if (item.tempo === 0) {
                item.ativo = false;
                io.emit('leilaoEncerrado', { id: item.id });
            }
        }
    });
    io.emit('tick', leiloes.map(i => ({ id: i.id, tempo: i.tempo })));
}, 1000);

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);
});

app.get('/api/leiloes', (req, res) => res.json(leiloes));

app.post('/api/lance', (req, res) => {
    const { id, valor } = req.body;
    const item = leiloes.find(l => l.id === id);

    if (item && item.ativo && valor > item.lanceAtual) {
        item.lanceAtual = valor;
        // Se alguém der lance nos últimos 30 segundos, adicionamos mais 30 segundos (estilo profissional)
        if(item.tempo < 30) item.tempo += 30;
        
        io.emit('atualizarLance', { id: item.id, novoValor: item.lanceAtual, novoTempo: item.tempo });
        return res.json({ success: true });
    }
    res.status(400).json({ success: false });
});

app.post('/api/novo-item', (req, res) => {
    const { nome, precoInicial, imagem } = req.body;
    const novo = {
        id: Date.now(),
        nome,
        lanceAtual: parseFloat(precoInicial),
        imagem: imagem || `https://picsum.photos/300/200?random=${Math.random()}`,
        tempo: 600, // 10 minutos padrão
        ativo: true
    };
    leiloes.push(novo);
    io.emit('novoItemAdicionado', novo);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
