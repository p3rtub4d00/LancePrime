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
        termino: Date.now() + 600000,
        foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800",
        destaque: true, // EXEMPLO DE ITEM PREMIUM
        lances: []
    }
];

io.on('connection', (socket) => {
    socket.emit('update_lista', leiloes);

    // 1. CRIAR NOVO LEILÃO (Agora aceita o campo 'destaque')
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
            destaque: dados.destaque || false, // Recebe se é Premium ou não
            lances: []
        };
        
        // Se for destaque, coloca no topo da lista, senão coloca no fim (ou abaixo dos destaques)
        if (dados.destaque) {
            leiloes.unshift(novoLeilao);
        } else {
            // Encontra o último destaque para inserir logo após
            const ultimoDestaque = leiloes.findLastIndex(l => l.destaque);
            leiloes.splice(ultimoDestaque + 1, 0, novoLeilao);
        }

        io.emit('update_lista', leiloes);
        
        const tipoMsg = dados.destaque ? 'warning' : 'info';
        const textoMsg = dados.destaque ? `⭐ NOVO DESTAQUE: ${dados.titulo}` : `📢 Novo leilão: ${dados.titulo}`;
        io.emit('notificacao', { tipo: tipoMsg, msg: textoMsg });
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
                    io.emit('notificacao', { tipo: 'warning', msg: `🔥 Tempo estendido: ${leilao.item}!` });
                }

                io.emit('update_lista', leiloes);
                io.emit('notificacao', { tipo: 'success', msg: `💰 ${usuario} ofertou R$ ${valor.toLocaleString()} no ${leilao.item}!` });
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor Marketplace rodando na porta ${PORT}`));
