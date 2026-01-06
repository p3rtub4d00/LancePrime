const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

// Simulação de Banco de Dados (Array temporário)
let leiloes = [
    { id: 1, nome: "iPhone 15 Pro", lanceAtual: 4500, imagem: "https://picsum.photos/300/200?random=1", tempo: 3600 },
    { id: 2, nome: "Macbook Air M2", lanceAtual: 7200, imagem: "https://picsum.photos/300/200?random=2", tempo: 1800 },
    { id: 3, nome: "PlayStation 5", lanceAtual: 3100, imagem: "https://picsum.photos/300/200?random=3", tempo: 5400 }
];

// Rota para pegar os itens
app.get('/api/leiloes', (req, res) => {
    res.json(leiloes);
});

// Rota para dar um lance
app.post('/api/lance', (req, res) => {
    const { id, valor } = req.body;
    const item = leiloes.find(l => l.id === id);

    if (item && valor > item.lanceAtual) {
        item.lanceAtual = valor;
        return res.json({ success: true, novoLance: item.lanceAtual });
    }
    res.status(400).json({ success: false, message: "Lance muito baixo!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
