// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Dados em memória (Substituirá o Banco de Dados por enquanto)
let leilao = {
    id: 1,
    item: "MacBook Pro M3 Max",
    valorAtual: 5000,
    incrementoMinimo: 200,
    termino: Date.now() + 600000, // 10 minutos a partir de agora
    lances: []
};

io.on('connection', (socket) => {
    // Envia o estado atual do leilão para quem conecta
    socket.emit('update_auction', leilao);

    socket.on('dar_lance', (data) => {
        const { valor, usuario } = data;
        const agora = Date.now();

        // Validação de valor
        if (valor >= leilao.valorAtual + leilao.incrementoMinimo && agora < leilao.termino) {
            leilao.valorAtual = valor;
            leilao.lances.unshift({ usuario, valor, data: new Date() });

            // REGRA DOS 2 MINUTOS
            const tempoRestante = leilao.termino - agora;
            if (tempoRestante < 120000) { // menos de 2 min
                leilao.termino = agora + 120000; // Reseta para 2 min
            }

            io.emit('update_auction', leilao);
            io.emit('notificacao', { msg: `Novo lance de R$ ${valor}!`, autor: usuario });
        }
    });
});

server.listen(3001, () => console.log("Servidor rodando na porta 3001"));
