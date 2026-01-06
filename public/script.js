function mostrarSecao(secao) {
    document.getElementById('secao-home').style.display = secao === 'home' ? 'block' : 'none';
    document.getElementById('secao-vender').style.display = secao === 'vender' ? 'block' : 'none';
}

async function carregarLeiloes() {
    const response = await fetch('/api/leiloes');
    const itens = await response.json();
    const grid = document.getElementById('leiloes-grid');
    grid.innerHTML = '';

    itens.forEach(item => {
        grid.innerHTML += `
            <div class="card">
                <img src="${item.imagem}" alt="${item.nome}">
                <div class="card-content">
                    <h3 class="card-title">${item.nome}</h3>
                    <span class="price-tag">R$ ${item.lanceAtual.toLocaleString('pt-BR')}</span>
                    <button class="btn-bid" onclick="darLance(${item.id}, ${item.lanceAtual + 50})">Dar Lance (+ R$50)</button>
                </div>
            </div>`;
    });
}

// Lógica para cadastrar novo item
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
        alert("Item anunciado com sucesso!");
        document.getElementById('form-item').reset();
        mostrarSecao('home');
        carregarLeiloes();
    }
});

async function darLance(id, valor) {
    const res = await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor })
    });
    if (res.ok) carregarLeiloes();
}

carregarLeiloes();
