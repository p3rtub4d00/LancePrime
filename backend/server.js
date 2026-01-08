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
            termino: Date.now() + (dados.minutos * 60000),
            foto: dados.foto || "https://placehold.co/600x400?text=Sem+Imagem",
            destaque: dados.destaque || false,
            statusPagamento: 'pendente',
            dadosRecibo: null,
            lances: []
        };
        
        // Lógica de Destaque: Coloca no início da lista
        if (dados.destaque) {
            leiloes.unshift(novoLeilao);
        } else {
            // Se não é destaque, tenta colocar após os destaques existentes
            const ultimoDestaque = leiloes.findLastIndex(l => l.destaque);
            if (ultimoDestaque >= 0) {
                leiloes.splice(ultimoDestaque + 1, 0, novoLeilao);
            } else {
                leiloes.unshift(novoLeilao); // Se não tem destaques, vai pro topo
            }
        }
        
        io.emit('update_lista', leiloes);
        io.emit('notificacao', { tipo: 'info', msg: `📢 Novo item: ${dados.titulo}` });
    });

    socket.on('dar_lance', (dados) => {
        const { idLeilao, valor, usuario, whatsapp } = dados;
        const leilao = leiloes.find(l => l.id === idLeilao);
        
        if (leilao) {
            const agora = Date.now();
            if (valor > leilao.valorAtual && agora < leilao.termino) {
                leilao.valorAtual = Number(valor);
                leilao.lances.unshift({ usuario, whatsapp, valor: Number(valor), data: new Date().toLocaleTimeString() });
                
                if (leilao.termino - agora < 120000) {
                    leilao.termino = agora + 120000;
                    io.emit('notificacao', { tipo: 'warning', msg: `🔥 Tempo extra: ${leilao.item}!` });
                }
                io.emit('update_lista', leiloes);
                io.emit('notificacao', { tipo: 'success', msg: `💰 ${usuario} lidera com R$ ${Number(valor).toLocaleString()}!` });
            }
        }
    });

    // 1. GERA RECIBO
    socket.on('gerar_recibo_pagamento', (dados) => {
        const { idLeilao, recibo } = dados;
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'analise';
            leilao.dadosRecibo = recibo;
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'info', msg: `🧾 Recibo gerado! Vendedor notificado.` });
        }
    });

    // 2. VENDEDOR VALIDA
    socket.on('vendedor_validar_recibo', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'validado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'info', msg: `🛡️ Recibo validado! Admin conferindo.` });
        }
    });

    // 3. ADMIN APROVA
    socket.on('admin_aprovar_pagamento', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'aprovado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'success', msg: `✅ Pagamento Retido com Sucesso! Envio autorizado.` });
        }
    });

    // 4. COMPRADOR CONFIRMA
    socket.on('comprador_confirmar_recebimento', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'finalizado';
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'success', msg: `🎉 Entrega confirmada! Dinheiro liberado.` });
        }
    });

    // 5. COMPRADOR ABRE DISPUTA
    socket.on('comprador_reportar_problema', (idLeilao) => {
        const leilao = leiloes.find(l => l.id === idLeilao);
        if (leilao) {
            leilao.statusPagamento = 'bloqueado'; // Vai para o tribunal do admin
            io.emit('update_lista', leiloes);
            io.emit('notificacao', { tipo: 'error', msg: `🚨 Disputa aberta para ${leilao.item}!` });
        }
    });

    // 6. ADMIN RESOLVE DISPUTA (NOVO!)
    socket.on('admin_resolver_disputa', (dados) => {
        const { idLeilao, decisao } = dados; // decisao: 'reembolsar' ou 'liberar'
        const leilao = leiloes.find(l => l.id === idLeilao);
        
        if (leilao) {
            if (decisao === 'reembolsar') {
                leilao.statusPagamento = 'reembolsado'; // Dinheiro volta pro comprador
                io.emit('notificacao', { tipo: 'info', msg: `↩️ Reembolso processado para ${leilao.item}. Venda cancelada.` });
            } else {
                leilao.statusPagamento = 'finalizado'; // Dinheiro vai pro vendedor
                io.emit('notificacao', { tipo: 'success', msg: `⚖️ Disputa julgada a favor do Vendedor. Pagamento liberado.` });
            }
            io.emit('update_lista', leiloes);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
