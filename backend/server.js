const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { cpf, cnpj } = require('cpf-cnpj-validator');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } 
});

// Banco de dados temporário (em memória)
let leilao = {
    id: 1,
    item: "Carro Esportivo Luxury 2024",
    descricao: "V8 Turbo, 0km, Completo com teto solar.",
    valorAtual: 150000,
    incrementoMinimo: 5000,
    termino: Date.now() + 300000, // 5 minutos para teste
    fotos: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800"],
    lances: []
};

// Rota de validação de usuário (Simulação)
app.post('/auth/register', (req, res) => {
    const { nome, documento } = req.body;
    const isValid = cpf.isValid(documento) || cnpj.isValid(documento);
    if (!isValid) return res.status(400).json({ error: "CPF/CNPJ Inválido" });
    res.json({ message: "Usuário validado com sucesso", user: nome });
});

io.on('connection', (socket) => {
    socket.emit('update_auction', leilao);

    socket.on('dar_lance', (data) => {
        const { valor, usuario } = data;
        const agora = Date.now();

        if (valor >= leilao.valorAtual + leilao.incrementoMinimo && agora < leilao.termino) {
            leilao.valorAtual = valor;
            leilao.lances.unshift({ usuario, valor, data: new Date().toLocaleTimeString() });

            // REGRA DOS 2 MINUTOS
            const tempoRestante = leilao.termino - agora;
            if (tempoRestante < 120000) {
                leilao.termino = agora + 120000;
            }

            io.emit('update_auction', leilao);
            io.emit('notificacao', { msg: `Novo lance de R$ ${valor.toLocaleString()}`, autor: usuario });
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
