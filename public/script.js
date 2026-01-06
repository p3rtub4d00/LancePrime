const socket = io();
let meuNome = localStorage.getItem('usuario');

function mostrarSecao(s) {
    document.getElementById('secao-home').style.display = s === 'home' ? 'block' : 'none';
    document.getElementById('secao-vender').style.display = s === 'vender' ? 'block' : 'none';
}

function fazerLogin() {
    const nome = prompt("Seu nome para lances:");
    if(nome) { localStorage.setItem('usuario', nome); location.reload(); }
}

if(meuNome) {
    document.getElementById('user-display').innerText = `Olá, ${meuNome}`;
    document.getElementById('btn-login').style.display = 'none';
}

function renderizarItem(item) {
    const grid = document.getElementById('leiloes-grid');
    grid.insertAdjacentHTML('beforeend', `
        <div class="card" id="card-${item.id}">
            <div class="timer" id="timer-${item.id}">--:--</div>
            <img src="${item.imagem}">
            <div class="card-content">
                <h3>${item.nome}</h3>
                <span class="price-tag" id="preco-${item.id}">R$ ${item.lanceAtual.toLocaleString('pt-BR')}</span>
                <p class="licitante">Líder: <strong id="user-${item.id}">${item.ultimoLicitante}</strong></p>
                <button class="btn-bid" id="btn-${item.id}" onclick="darLance(${item.id})">Dar Lance (+ R$50)</button>
            </div>
        </div>
    `);
}

async function darLance(id) {
    if(!meuNome) return fazerLogin();
    const card = document.getElementById(`preco-${id}`);
    const precoAtual = parseFloat(card.innerText.replace('R$', '').replace(/\./g, '').replace(',', '.'));
    
    await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor: precoAtual + 50, usuario: meuNome })
    });
}

async function cadastrarItem() {
    const nome = document.getElementById('nome-item').value;
    const preco = document.getElementById('preco-item').value;
    const img = document.getElementById('img-item').value;
    
    await fetch('/api/novo-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, precoInicial: preco, imagem: img })
    });
    mostrarSecao('home');
}

socket.on('tick', (itens) => {
    itens.forEach(item => {
        const t = document.getElementById(`timer-${item.id}`);
        if(t) {
            const m = Math.floor(item.tempo / 60);
            const s = item.tempo % 60;
            t.innerText = `${m}:${s.toString().padStart(2, '0')}`;
            if(!item.ativo) document.getElementById(`btn-${item.id}`).innerText = "Encerrado";
        }
    });
});

socket.on('atualizarLance', (d) => {
    document.getElementById(`preco-${d.id}`).innerText = `R$ ${d.novoValor.toLocaleString('pt-BR')}`;
    document.getElementById(`user-${d.id}`).innerText = d.licitante;
});

socket.on('novoItem', (item) => renderizarItem(item));

fetch('/api/leiloes').then(r => r.json()).then(itens => itens.forEach(renderizarItem));
