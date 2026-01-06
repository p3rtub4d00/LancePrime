const socket = io();
let usuarioLogado = localStorage.getItem('usuarioNome');
let itemSelecionadoId = null;

// Inicialização
if (usuarioLogado) atualizarInterfaceLogin();

function mostrarSecao(secao) {
    ['secao-home', 'secao-vender', 'secao-detalhes'].forEach(s => {
        document.getElementById(s).style.display = (s === `secao-${secao}`) ? 'block' : 'none';
    });
}

function abrirModalLogin() {
    document.getElementById('modal-login').style.display = 'flex';
}

function salvarLogin() {
    const nome = document.getElementById('login-name').value;
    if (nome) {
        localStorage.setItem('usuarioNome', nome);
        usuarioLogado = nome;
        atualizarInterfaceLogin();
        document.getElementById('modal-login').style.display = 'none';
    }
}

function atualizarInterfaceLogin() {
    document.getElementById('user-display').innerText = `Olá, ${usuarioLogado.split(' ')[0]}!`;
    document.getElementById('btn-login-trigger').style.display = 'none';
}

async function verDetalhes(id) {
    const res = await fetch('/api/leiloes');
    const itens = await res.json();
    const item = itens.find(i => i.id == id);
    
    if (item) {
        itemSelecionadoId = id;
        document.getElementById('detalhe-img').src = item.imagem;
        document.getElementById('detalhe-nome').innerText = item.nome;
        document.getElementById('detalhe-preco').innerText = `R$ ${item.lanceAtual.toLocaleString('pt-BR')}`;
        document.getElementById('btn-lance-detalhe').onclick = () => prepararLance(id);
        
        mostrarSecao('detalhes');
        window.scrollTo(0,0);
    }
}

function formatarTempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
}

function renderizarItem(item) {
    const grid = document.getElementById('leiloes-grid');
    grid.insertAdjacentHTML('beforeend', `
        <div class="card" data-id="${item.id}" onclick="verDetalhes(${item.id})">
            <div class="timer" id="timer-${item.id}">${formatarTempo(item.tempo)}</div>
            <img src="${item.imagem}">
            <div class="card-content">
                <h3 class="card-title">${item.nome}</h3>
                <span class="price-tag">R$ ${item.lanceAtual.toLocaleString('pt-BR')}</span>
                <button class="btn-bid">Ver e dar lance</button>
            </div>
        </div>
    `);
}

async function carregarLeiloes() {
    const response = await fetch('/api/leiloes');
    const itens = await response.json();
    document.getElementById('leiloes-grid').innerHTML = '';
    itens.forEach(renderizarItem);
}

async function prepararLance(id) {
    if (!usuarioLogado) {
        abrirModalLogin();
        return;
    }

    const res = await fetch('/api/leiloes');
    const itens = await res.json();
    const item = itens.find(i => i.id == id);
    
    await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor: item.lanceAtual + 50, usuario: usuarioLogado })
    });
}

// SOCKETS
socket.on('tick', (dados) => {
    dados.forEach(d => {
        const el = document.getElementById(`timer-${d.id}`);
        if (el) el.innerText = formatarTempo(d.tempo);
        
        if (itemSelecionadoId == d.id) {
            document.getElementById('detalhe-timer').innerText = formatarTempo(d.tempo);
        }
    });
});

socket.on('atualizarLance', (dados) => {
    const card = document.querySelector(`[data-id="${dados.id}"] .price-tag`);
    if (card) card.innerText = `R$ ${dados.novoValor.toLocaleString('pt-BR')}`;
    
    if (itemSelecionadoId == dados.id) {
        document.getElementById('detalhe-preco').innerText = `R$ ${dados.novoValor.toLocaleString('pt-BR')}`;
    }
});

carregarLeiloes();
