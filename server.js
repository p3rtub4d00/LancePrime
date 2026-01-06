const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

let leiloes = [
    { id: 1, nome: "iPhone 15 Pro", lanceAtual: 4500, imagem: "https://picsum.photos/300/200?random=1" },
    { id: 2, nome: "Macbook Air M2", lanceAtual: 7200, imagem: "https://picsum.photos/300/200?random=2" }
];

// Listar itens
app.get('/api/leiloes', (req, res) => res.json(leiloes));

// Dar lance
app.post('/api/lance', (req, res) => {
    const { id, valor } = req.body;
    const item = leiloes.find(l => l.id === id);
    if (item && valor > item.lanceAtual) {
        item.lanceAtual = valor;
        return res.json({ success: true });
    }
    res.status(400).json({ success: false, message: "Lance insuficiente!" });
});

// Adicionar novo item ao leilão
app.post('/api/novo-item', (req, res) => {
    const { nome, precoInicial, imagem } = req.body;
    const novo = {
        id: leiloes.length + 1,
        nome,
        lanceAtual: parseFloat(precoInicial),
        imagem: imagem || "https://picsum.photos/300/200?random=" + Math.random()
    };
    leiloes.push(novo);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
