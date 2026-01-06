const socket = io();
let meuNome = localStorage.getItem('usuario');

function fazerLogin() {
    const nome = prompt("Qual seu nome para participar?");
    if(nome) {
        localStorage.setItem('usuario', nome);
        location.reload();
    }
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
                <button class="btn-bid" id="btn-${item.id}" onclick="darLance(${item.id}, ${item.lanceAtual})">Dar Lance (+ R$50)</button>
            </div>
        </div>
    `);
}

async function darLance(id, precoAtual) {
    if(!meuNome) return fazerLogin();
    
    await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor: precoAtual + 50, usuario: meuNome })
    });
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

fetch('/api/leiloes').then(r => r.json()).then(itens => itens.forEach(renderizarItem));
