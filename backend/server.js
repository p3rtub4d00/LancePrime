const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// DADOS EM MEMÓRIA
let leiloes = [
    {
        id: 1,
        dono: "Sistema",
        whatsapp: "5511999999999",
        item: "Porsche Panamera 2024",
        descricao: "V8 Turbo, 0km, Completo. Blindado Nível III-A.",
        localizacao: "São Paulo, SP",
        frete: "retirada", // retirada, correios, ambos
        valorAtual: 150000,
        incrementoMinimo: 5000,
        termino: Date.now() + 600000,
        foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800",
        destaque: true,
        lances: []
    }
];

io.on('connection', (socket) => {
    socket.emit('update_lista', leiloes);

    socket.on('criar_leilao', (dados) => {
        const novoLeilao = {
            id: Date.now(),
            dono: dados.usuario,
            whatsapp: dados.whatsapp, // Contato do vendedor
            item: dados.titulo,
            descricao: dados.descricao,
            localizacao: dados.localizacao,
            frete: dados.frete,
            valorAtual: Number(dados.valorInicial),
            incrementoMinimo: Number(dados.incremento),
            termino: Date.now() + (dados.minutos * 60000),
            foto: dados.foto || "https://placehold.co/600x400?text=Sem+Imagem",
            destaque: dados.destaque || false,
            lances: []
        };
        
        if (dados.destaque) {
            leiloes.unshift(novoLeilao);
        } else {
            const ultimoDestaque = leiloes.findLastIndex(l => l.destaque);
            leiloes.splice(ultimoDestaque + 1, 0, novoLeilao);
        }

        io.emit('update_lista', leiloes);
        io.emit('notificacao', { tipo: 'info', msg: `📢 Novo item: ${dados.titulo}` });
    });

    socket.on('dar_lance', (dados) => {
        const { idLeilao, valor, usuario, whatsapp } = dados; // Recebe whats do comprador tmb
        const leilao = leiloes.find(l => l.id === idLeilao);

        if (leilao) {
            const agora = Date.now();
            if (valor >= leilao.valorAtual + leilao.incrementoMinimo && agora < leilao.termino) {
                leilao.valorAtual = valor;
                // Salva quem deu o lance e o contato dele
                leilao.lances.unshift({ usuario, whatsapp, valor, data: new Date().toLocaleTimeString() });

                if (leilao.termino - agora < 120000) {
                    leilao.termino = agora + 120000;
                    io.emit('notificacao', { tipo: 'warning', msg: `🔥 Tempo extra: ${leilao.item}!` });
                }

                io.emit('update_lista', leiloes);
                io.emit('notificacao', { tipo: 'success', msg: `💰 ${usuario} cobriu a oferta no ${leilao.item}!` });
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
