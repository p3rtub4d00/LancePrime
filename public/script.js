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
                    <button class="btn-bid" onclick="darLance(${item.id}, ${item.lanceAtual + 50})">
                        Dar Lance (+ R$ 50)
                    </button>
                </div>
            </div>
        `;
    });
}

async function darLance(id, valor) {
    const response = await fetch('/api/lance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, valor })
    });

    const data = await response.json();
    if (data.success) {
        alert("Lance realizado com sucesso!");
        carregarLeiloes();
    } else {
        alert(data.message);
    }
}

carregarLeiloes();
