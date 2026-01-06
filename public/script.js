const socket = io();

// 1. Navegação entre Abas
function mostrarSecao(secao) {
    document.getElementById('secao-home').style.display = secao === 'home' ? 'block' : 'none';
    document.getElementById('secao-vender').style.display = secao === 'vender' ? 'block' : 'none';
    if(secao === 'home') carregarLeiloes();
}

// 2. Renderizar um item individualmente na Grid
function renderizarItem(item) {
    const grid = document.getElementById('leiloes-grid');
    const htmlItem = `
        <div class="card" data-id="${item.id}">
            <img src="${item.imagem}" alt="${item.nome}">
            <div class="card-content">
                <h3 class="card-title">${item.nome}</h3>
                <span class="price-tag">R$ ${item.lanceAtual.toLocaleString('pt-BR')}</span>
                <button class="btn-bid" onclick="prepararLance(${item.id})">Dar Lance (+ R$ 50)</button>
            </div>
        </div>
    `;
    grid.insertAdjacentHTML('beforeend', htmlItem);
}

// 3. Carregar todos os leilões iniciais
async function carregarLeiloes() {
    const response = await fetch('/api/leiloes');
    const itens = await response.json();
    const grid = document.getElementById('leiloes-grid');
    grid.innerHTML = ''; // Limpa a grid antes de carregar
    itens.forEach(item => renderizarItem(item));
}

// 4. Lógica para enviar um lance
async function prepararLance(id) {
    // Busca o preço atual direto da tela para calcular o próximo
    const card = document.querySelector(`[data-id="${id}"]`);
    const precoTexto = card.querySelector('.price-tag').innerText;
    const precoAtual = parseFloat(precoTexto.replace('R$', '').replace(/\./g, '').replace(',', '.'));
    
    const novoValor = precoAtual + 50;

    const res = await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor: novoValor })
    });

    if (!res.ok) alert("Erro ao dar lance. Tente um valor maior.");
}

// 5. Cadastrar novo item
document.getElementById('form-item').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novoItem = {
        nome: document.getElementById('nome-item').value,
        precoInicial: document.getElementById('preco-item').value,
        imagem: document.getElementById('img-item').value
    };

    const res = await fetch('/api/novo-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
    });

    if (res.ok) {
        document.getElementById('form-item').reset();
        mostrarSecao('home');
    }
});

// --- EVENTOS EM TEMPO REAL (SOCKET.IO) ---

// Atualiza o preço na tela de todo mundo quando alguém dá um lance
socket.on('atualizarLance', (dados) => {
    const card = document.querySelector(`[data-id="${dados.id}"]`);
    if (card) {
        const precoElemento = card.querySelector('.price-tag');
        precoElemento.innerText = `R$ ${dados.novoValor.toLocaleString('pt-BR')}`;
        
        // Efeito visual de atualização
        precoElemento.style.color = "#10b981";
        setTimeout(() => precoElemento.style.color = "#2563eb", 1000);
    }
});

// Adiciona o item na tela de todo mundo quando um novo é criado
socket.on('novoItemAdicionado', (novoItem) => {
    renderizarItem(novoItem);
});

// Inicialização
carregarLeiloes();
