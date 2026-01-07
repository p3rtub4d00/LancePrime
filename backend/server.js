const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } 
});

// LISTA DE LEILÕES (Em memória)
let leiloes = [
    {
        id: 1,
        dono: "Sistema",
        item: "Porsche Panamera 2024",
        descricao: "V8 Turbo, 0km, Completo com teto solar.",
        valorAtual: 150000,
        incrementoMinimo: 5000,
        termino: Date.now() + 600000, // 10 min
        foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800",
        lances: []
    }
];

io.on('connection', (socket) => {
    socket.emit('update_lista', leiloes);

    // 1. CRIAR NOVO LEILÃO
    socket.on('criar_leilao', (dados) => {
        const novoLeilao = {
            id: Date.now(),
            dono: dados.usuario,
            item: dados.titulo,
            descricao: dados.descricao,
            valorAtual: Number(dados.valorInicial),
            incrementoMinimo: Number(dados.incremento),
            termino: Date.now() + (dados.minutos * 60000),
            foto: dados.foto || "https://placehold.co/600x400?text=Sem+Imagem",
            lances: []
        };
        leiloes.unshift(novoLeilao);
        io.emit('update_lista', leiloes);
        // NOTIFICAR TODOS
        io.emit('notificacao', { tipo: 'info', msg: `📢 Novo leilão: ${dados.titulo}` });
    });

    // 2. DAR LANCE
    socket.on('dar_lance', (dados) => {
        const { idLeilao, valor, usuario } = dados;
        const leilaoIndex = leiloes.findIndex(l => l.id === idLeilao);

        if (leilaoIndex !== -1) {
            const leilao = leiloes[leilaoIndex];
            const agora = Date.now();

            if (valor >= leilao.valorAtual + leilao.incrementoMinimo && agora < leilao.termino) {
                leilao.valorAtual = valor;
                leilao.lances.unshift({ usuario, valor, data: new Date().toLocaleTimeString() });

                // Regra dos 2 minutos
                if (leilao.termino - agora < 120000) {
                    leilao.termino = agora + 120000;
                    io.emit('notificacao', { tipo: 'warning', msg: `🔥 Reta final! O tempo do ${leilao.item} foi estendido!` });
                }

                io.emit('update_lista', leiloes);
                // NOTIFICAR O LANCE
                io.emit('notificacao', { tipo: 'success', msg: `💰 ${usuario} deu lance de R$ ${valor.toLocaleString()} no ${leilao.item}!` });
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor Marketplace rodando na porta ${PORT}`));
