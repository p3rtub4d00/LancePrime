import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign } from 'lucide-react';

// ATENÇÃO: MANTENHA A URL DO SEU RENDER AQUI
const socket = io('https://duckhuntbet.onrender.com');

function App() {
  const [leiloes, setLeiloes] = useState([]);
  const [pagina, setPagina] = useState('home'); // home | criar | perfil
  const [usuario] = useState("User_" + Math.floor(Math.random() * 1000));
  
  // Estado do Formulário
  const [novoItem, setNovoItem] = useState({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '' });

  useEffect(() => {
    socket.on('update_lista', (data) => {
      setLeiloes(data);
    });
    return () => socket.off('update_lista');
  }, []);

  // Timer Global para atualizar a tela a cada segundo
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const enviarLance = (leilao) => {
    const valorLance = leilao.valorAtual + leilao.incrementoMinimo;
    socket.emit('dar_lance', { idLeilao: leilao.id, valor: valorLance, usuario: usuario });
  };

  const criarLeilao = (e) => {
    e.preventDefault();
    socket.emit('criar_leilao', { ...novoItem, usuario });
    setNovoItem({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '' });
    setPagina('home'); // Volta para home
  };

  // Função auxiliar de tempo
  const formatarTempo = (termino) => {
    const diff = termino - agora;
    if (diff <= 0) return "ENCERRADO";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      
      {/* Topo */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-700 font-black text-xl">
            <Gavel /> LANCE<span className="text-yellow-500">PRIME</span>
          </div>
          <div className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-600">
            {usuario}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        
        {/* --- PÁGINA: HOME (FEED DE LEILÕES) --- */}
        {pagina === 'home' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Leilões Ativos</h2>
            {leiloes.map((leilao) => (
              <div key={leilao.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <img src={leilao.foto} className="w-full h-48 object-cover" alt="Item" />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight">{leilao.item}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${formatarTempo(leilao.termino) === 'ENCERRADO' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {formatarTempo(leilao.termino)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{leilao.descricao}</p>
                  
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Lance Atual</p>
                      <p className="text-xl font-black text-blue-700">R$ {leilao.valorAtual.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => enviarLance(leilao)}
                      disabled={formatarTempo(leilao.termino) === 'ENCERRADO'}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      LANCE (+{leilao.incrementoMinimo})
                    </button>
                  </div>
                  
                  {/* Último Lance */}
                  {leilao.lances.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      <User size={12}/> Último: <span className="font-bold">{leilao.lances[0].usuario}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- PÁGINA: CRIAR ANÚNCIO --- */}
        {pagina === 'criar' && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6">Criar Novo Leilão</h2>
            <form onSubmit={criarLeilao} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">O que você vai vender?</label>
                <input required className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Ex: iPhone 15 Pro Max" 
                  value={novoItem.titulo} onChange={e => setNovoItem({...novoItem, titulo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea required className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Detalhes do produto..." 
                  value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valor Inicial (R$)</label>
                  <input required type="number" className="w-full p-3 border rounded-lg bg-gray-50" 
                    value={novoItem.valorInicial} onChange={e => setNovoItem({...novoItem, valorInicial: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Incremento Mín (R$)</label>
                  <input required type="number" className="w-full p-3 border rounded-lg bg-gray-50" 
                    value={novoItem.incremento} onChange={e => setNovoItem({...novoItem, incremento: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL da Foto</label>
                <input className="w-full p-3 border rounded-lg bg-gray-50" placeholder="https://..." 
                  value={novoItem.foto} onChange={e => setNovoItem({...novoItem, foto: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700">
                PUBLICAR LEILÃO
              </button>
            </form>
          </div>
        )}

        {/* --- PÁGINA: MEU DASHBOARD --- */}
        {pagina === 'perfil' && (
          <div className="space-y-8">
            
            {/* Minhas Vendas */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign className="text-green-600"/> Itens que anunciei</h3>
              {leiloes.filter(l => l.dono === usuario).length === 0 ? (
                <p className="text-gray-400 text-sm">Você não anunciou nada.</p>
              ) : (
                leiloes.filter(l => l.dono === usuario).map(l => (
                  <div key={l.id} className="border-b py-3 last:border-0">
                    <div className="flex justify-between font-bold">
                      <span>{l.item}</span>
                      <span className="text-blue-600">R$ {l.valorAtual}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {l.lances.length} lances recebidos • {formatarTempo(l.termino)}
                    </div>
                    {/* Lista de quem deu lance no meu item */}
                    {l.lances.length > 0 && (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                        <span className="font-bold text-gray-600">Último lance:</span> {l.lances[0].usuario}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Meus Lances */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Gavel className="text-blue-600"/> Lances que eu dei</h3>
              {leiloes.filter(l => l.lances.some(lance => lance.usuario === usuario)).length === 0 ? (
                <p className="text-gray-400 text-sm">Você não deu lances ainda.</p>
              ) : (
                leiloes.filter(l => l.lances.some(lance => lance.usuario === usuario)).map(l => {
                  const meuUltimoLance = l.lances.find(lance => lance.usuario === usuario);
                  const estouGanhando = l.lances[0].usuario === usuario;
                  
                  return (
                    <div key={l.id} className="border-b py-3 last:border-0">
                      <div className="flex justify-between font-bold">
                        <span>{l.item}</span>
                        <span className={estouGanhando ? "text-green-600" : "text-red-500"}>
                          {estouGanhando ? "VENCENDO" : "SUPERADO"}
                        </span>
                      </div>
                      <div className="text-xs mt-1">
                        Seu lance: R$ {meuUltimoLance.valor} • Atual: R$ {l.valorAtual}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Menu Inferior (Navegação) */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-50">
        <button onClick={() => setPagina('home')} className={`flex flex-col items-center ${pagina === 'home' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Home size={24} />
          <span className="text-[10px] font-bold mt-1">Início</span>
        </button>
        <button onClick={() => setPagina('criar')} className={`flex flex-col items-center ${pagina === 'criar' ? 'text-blue-600' : 'text-gray-400'}`}>
          <PlusCircle size={32} className="mb-1" />
        </button>
        <button onClick={() => setPagina('perfil')} className={`flex flex-col items-center ${pagina === 'perfil' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold mt-1">Painel</span>
        </button>
      </nav>

    </div>
  );
}

export default App;
