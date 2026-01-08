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
        frete: "retirada",
        valorAtual: 150000,
        termino: Date.now() + 600000,
        foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800",
        destaque: true,
        statusPagamento: 'pendente', 
        dadosRecibo: null,
        lances: []
    }
];

io.on('connection', (socket) => {
    socket.emit('update_lista', leiloes);

    socket.on('criar_leilao', (dados) => {
        const novoLeilao = {
            id: Date.now(),
            dono: dados.usuario,
            whatsapp: dados.whatsapp,
            item: dados.titulo,
            descricao: dados.descricao,
            localizacao: dados.localizacao,
            frete: dados.frete,
            valorAtual: Number(dados.valorInicial),
            // REMOVIDO INCREMENTO: Agora o sistema aceita qualquer valor > atual
            termino: Date.now() + (dados.minutos * 60000),
            foto: dados.foto || "https://placehold.co/600x400?text=Sem+Imagem",
            destaque: dados.destaque || false,
            statusPagamento: 'pendente',
            dadosRecibo: null,
            lances: []
        };
        
        if (dados.destaque) {
            leiloes.unshift(novoLeilao);
        } else {
            const ultimoDestaque = leiloes.findLastIndex(l => l.destaque);
            leiloes.splice(ultimoDestaque + 1, 0, novoLeilao);
        }
        io.emit('update_lista', leiloes);
        io.emit('notificacao', { tipo: 'info', msg: `📢 Novo leilão: ${dados.titulo}` });
    });

    socket.on('dar_lance', (dados) => {
        const { idLeilao, valor, usuario, whatsapp } = dados;
        const leilao = leiloes.find(l => l.id === idLeilao);
        
        if (leilao) {
            const agora = Date.now();
            // REGRA: Lance apenas precisa ser MAIOR que o atual
            if (valor > leilao.valorAtual && agora < leilao.termino) {
                leilao.valorAtual = Number(valor);
                leilao.lances.unshift({ usuario, whatsapp, valor: Number(valor), data: new Date().toLocaleTimeString() });
                
                if (leilao.termino - agora < 120000) {
                    leilao.termino = agora + 120000;
                    io.emit('notificacao', { tipo: 'warning', msg: `🔥 Tempo extra: ${leilao.item}!` });
                }
                io.emit('update_lista', leiloes);
                io.emit('notificacao', { tipo: 'success', msg: `💰 ${usuario} deu lance de R$ ${Number(valor).toLocaleString()}!` });
            }
        }
    });

    // FLUXO DE PAGAMENTO (1. Gera Recibo -> Vendedor)
    socket.on('gerar_recibo_pagamento', (dados) => {
        const { idLeilao, recibo } = dados;
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'analise';
            leilao.dadosRecibo = recibo;
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'info', msg: `🧾 Recibo gerado para ${leilao.item}. Aguardando Vendedor.` });
        }
    });

    // FLUXO DE PAGAMENTO (2. Vendedor Valida -> Admin)
    socket.on('vendedor_validar_recibo', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'validado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'info', msg: `🛡️ Vendedor validou recibo. Aguardando Admin.` });
        }
    });

    // FLUXO DE PAGAMENTO (3. Admin Aprova -> Fim)
    socket.on('admin_aprovar_pagamento', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'aprovado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'success', msg: `✅ Pagamento Aprovado! Dinheiro seguro com a plataforma.` });
        }
    });

    // SEGURANÇA FINAL
    socket.on('comprador_confirmar_recebimento', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'finalizado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'success', msg: `🎉 Negócio Concluído: ${leilao.item}` });
        }
    });

    socket.on('comprador_reportar_problema', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'bloqueado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'error', msg: `🚨 Problema reportado no item ${leilao.item}.` });
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
