const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

let leiloes = [
    { id: 1, nome: "iPhone 15 Pro", lanceAtual: 4500, ultimoLicitante: "Nenhum", imagem: "https://picsum.photos/300/200?random=1", tempo: 600, ativo: true },
    { id: 2, nome: "Macbook Air M2", lanceAtual: 7200, ultimoLicitante: "Nenhum", imagem: "https://picsum.photos/300/200?random=2", tempo: 300, ativo: true }
];

setInterval(() => {
    leiloes.forEach(item => {
        if (item.ativo && item.tempo > 0) {
            item.tempo--;
            if (item.tempo === 0) item.ativo = false;
        }
    });
    io.emit('tick', leiloes.map(i => ({ id: i.id, tempo: i.tempo, ativo: i.ativo })));
}, 1000);

app.get('/api/leiloes', (req, res) => res.json(leiloes));

app.post('/api/lance', (req, res) => {
    const { id, valor, usuario } = req.body;
    const item = leiloes.find(l => l.id === id);

    if (item && item.ativo && valor > item.lanceAtual) {
        item.lanceAtual = valor;
        item.ultimoLicitante = usuario || "Anônimo";
        if(item.tempo < 30) item.tempo += 30;
        
        io.emit('atualizarLance', { 
            id: item.id, 
            novoValor: item.lanceAtual, 
            licitante: item.ultimoLicitante 
        });
        return res.json({ success: true });
    }
    res.status(400).json({ success: false });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
