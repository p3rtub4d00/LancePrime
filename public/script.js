const socket = io();

function mostrarSecao(secao) {
    document.getElementById('secao-home').style.display = secao === 'home' ? 'block' : 'none';
    document.getElementById('secao-vender').style.display = secao === 'vender' ? 'block' : 'none';
}

function formatarTempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
}

function renderizarItem(item) {
    const grid = document.getElementById('leiloes-grid');
    const htmlItem = `
        <div class="card" data-id="${item.id}">
            <div class="timer" id="timer-${item.id}">${formatarTempo(item.tempo)}</div>
            <img src="${item.imagem}" alt="${item.nome}">
            <div class="card-content">
                <h3 class="card-title">${item.nome}</h3>
                <span class="price-tag">R$ ${item.lanceAtual.toLocaleString('pt-BR')}</span>
                <button class="btn-bid" id="btn-${item.id}" onclick="prepararLance(${item.id})">Dar Lance (+ R$ 50)</button>
            </div>
        </div>
    `;
    grid.insertAdjacentHTML('beforeend', htmlItem);
}

async function carregarLeiloes() {
    const response = await fetch('/api/leiloes');
    const itens = await response.json();
    const grid = document.getElementById('leiloes-grid');
    grid.innerHTML = ''; 
    itens.forEach(item => renderizarItem(item));
}

async function prepararLance(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    const precoTexto = card.querySelector('.price-tag').innerText;
    const precoAtual = parseFloat(precoTexto.replace('R$', '').replace(/\./g, '').replace(',', '.'));
    
    await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor: precoAtual + 50 })
    });
}

document.getElementById('form-item').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novoItem = {
        nome: document.getElementById('nome-item').value,
        precoInicial: document.getElementById('preco-item').value,
        imagem: document.getElementById('img-item').value
    };
    await fetch('/api/novo-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
    });
    document.getElementById('form-item').reset();
    mostrarSecao('home');
});

// --- SOCKETS ---

// Sincroniza os cronómetros a cada segundo
socket.on('tick', (dados) => {
    dados.forEach(d => {
        const el = document.getElementById(`timer-${d.id}`);
        if (el) {
            el.innerText = formatarTempo(d.tempo);
            if (d.tempo < 60) el.style.color = "#ef4444"; // Fica vermelho no último minuto
        }
    });
});

socket.on('atualizarLance', (dados) => {
    const card = document.querySelector(`[data-id="${dados.id}"]`);
    if (card) {
        card.querySelector('.price-tag').innerText = `R$ ${dados.novoValor.toLocaleString('pt-BR')}`;
    }
});

socket.on('leilaoEncerrado', (dados) => {
    const btn = document.getElementById(`btn-${dados.id}`);
    if (btn) {
        btn.innerText = "Encerrado";
        btn.disabled = true;
        btn.style.background = "#64748b";
    }
});

socket.on('novoItemAdicionado', (novoItem) => renderizarItem(novoItem));

carregarLeiloes();
