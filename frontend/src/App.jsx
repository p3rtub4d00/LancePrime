import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign, ChevronRight, ShieldCheck, Award } from 'lucide-react';
// NOVAS IMPORTAÇÕES DE NOTIFICAÇÃO
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MANTENHA A URL DO SEU BACKEND AQUI
const socket = io('https://duckhuntbet.onrender.com');

function App() {
  const [leiloes, setLeiloes] = useState([]);
  const [pagina, setPagina] = useState('home');
  const [usuario] = useState("User_" + Math.floor(Math.random() * 1000));
  const [agora, setAgora] = useState(Date.now());

  const [novoItem, setNovoItem] = useState({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '' });

  useEffect(() => {
    socket.on('update_lista', (data) => setLeiloes(data));
    
    // --- LÓGICA DE NOTIFICAÇÃO NOVA ---
    socket.on('notificacao', (data) => {
      // Exibe o toast baseado no tipo (sucesso, aviso, info)
      if (data.tipo === 'success') toast.success(data.msg);
      else if (data.tipo === 'warning') toast.warn(data.msg);
      else toast.info(data.msg);
    });

    return () => {
      socket.off('update_lista');
      socket.off('notificacao');
    };
  }, []);

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
    setPagina('home');
  };

  const formatarTempo = (termino) => {
    const diff = termino - agora;
    if (diff <= 0) return "ENCERRADO";
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans text-gray-900">
      
      {/* COMPONENTE DE NOTIFICAÇÃO (INVISÍVEL ATÉ ATIVAR) */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Header Profissional */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-2xl tracking-tight">
            <Gavel className="text-blue-600" size={28} /> 
            <span>LANCE<span className="text-blue-600">PRIME</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 font-medium">
              <ShieldCheck size={16} className="text-green-600" /> Ambiente Seguro
            </div>
            <div className="flex items-center gap-2 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-200">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-700">
                <User size={16} />
              </div>
              <span className="font-semibold text-sm text-gray-700">{usuario}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* --- PÁGINA: HOME (FEED DE LEILÕES) --- */}
        {pagina === 'home' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="text-blue-600" size={24} /> Leilões em Destaque
              </h2>
              <p className="text-sm text-gray-500">{leiloes.length} lotes disponíveis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leiloes.map((leilao) => {
                const status = formatarTempo(leilao.termino);
                const encerrado = status === "ENCERRADO";

                return (
                  <div key={leilao.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden group">
                    <div className="relative">
                      <img src={leilao.foto} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" alt="Item" />
                      <div className="absolute top-3 right-3">
                        <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${encerrado ? 'bg-red-100 text-red-700' : 'bg-white text-blue-700'}`}>
                          <Clock size={14} /> {status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1" title={leilao.item}>{leilao.item}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={leilao.descricao}>{leilao.descricao}</p>
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Lance Atual</p>
                        <p className="text-2xl font-black text-blue-900">{formatarMoeda(leilao.valorAtual)}</p>
                        {leilao.lances.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1 truncate">
                            <User size={12} className="text-gray-400"/> Por: <span className="font-semibold text-gray-700">{leilao.lances[0].usuario}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => enviarLance(leilao)}
                        disabled={encerrado}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        {encerrado ? "LEILÃO ENCERRADO" : `DAR LANCE (+${formatarMoeda(leilao.incrementoMinimo)})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- PÁGINA: CRIAR ANÚNCIO --- */}
        {pagina === 'criar' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b border-gray-100">
              <PlusCircle className="text-blue-600" size={28} /> Criar Novo Leilão
            </h2>
            <form onSubmit={criarLeilao} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Título do Anúncio</label>
                  <input required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Ex: MacBook Pro M3 Max - Lacrado" 
                    value={novoItem.titulo} onChange={e => setNovoItem({...novoItem, titulo: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Descrição Detalhada</label>
                  <textarea required rows="4" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" placeholder="Descreva o estado, especificações e detalhes importantes..." 
                    value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Valor Inicial (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                    <input required type="number" min="1" className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="0,00"
                      value={novoItem.valorInicial} onChange={e => setNovoItem({...novoItem, valorInicial: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Incremento Mínimo (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                    <input required type="number" min="1" className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Ex: 50,00"
                      value={novoItem.incremento} onChange={e => setNovoItem({...novoItem, incremento: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duração (Minutos)</label>
                  <input required type="number" min="1" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Ex: 10" 
                    value={novoItem.minutos} onChange={e => setNovoItem({...novoItem, minutos: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL da Imagem de Capa</label>
                  <input required type="url" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="https://exemplo.com/imagem.jpg" 
                    value={novoItem.foto} onChange={e => setNovoItem({...novoItem, foto: e.target.value})} />
                  <p className="text-xs text-gray-500 mt-2">Recomendamos imagens de alta qualidade (min. 800x600).</p>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all text-lg shadow-sm active:scale-[0.98]">
                  PUBLICAR LEILÃO AGORA
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- PÁGINA: MEU DASHBOARD --- */}
        {pagina === 'perfil' && (
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Minhas Vendas */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <DollarSign className="text-green-600" size={24}/> Meus Anúncios Ativos
              </h3>
              {leiloes.filter(l => l.dono === usuario).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <DollarSign size={40} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Você ainda não anunciou nenhum item.</p>
                  <button onClick={() => setPagina('criar')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Começar a Vender</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {leiloes.filter(l => l.dono === usuario).map(l => (
                    <div key={l.id} className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:border-blue-300 transition-colors">
                      <div className="flex gap-4">
                        <img src={l.foto} className="w-20 h-20 object-cover rounded-lg bg-gray-100" alt="Thumb" />
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{l.item}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={14}/> {formatarTempo(l.termino)} • {l.lances.length} lances
                          </p>
                          {l.lances.length > 0 && (
                            <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                              <User size={12}/> Último de: {l.lances[0].usuario}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col justify-center items-end min-w-[120px]">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Valor Atual</p>
                        <p className="text-2xl font-black text-blue-900">{formatarMoeda(l.valorAtual)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meus Lances */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <Gavel className="text-blue-600" size={24}/> Meus Lances Recentes
              </h3>
              {leiloes.filter(l => l.lances.some(lance => lance.usuario === usuario)).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <Gavel size={40} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Você ainda não deu lances em nenhum leilão.</p>
                  <button onClick={() => setPagina('home')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Explorar Leilões</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {leiloes.filter(l => l.lances.some(lance => lance.usuario === usuario)).map(l => {
                    const meuUltimoLance = l.lances.find(lance => lance.usuario === usuario);
                    const estouGanhando = l.lances.length > 0 && l.lances[0].usuario === usuario;
                    const encerrado = formatarTempo(l.termino) === "ENCERRADO";
                    
                    let statusBadge;
                    if (encerrado) {
                        statusBadge = estouGanhando 
                            ? <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Award size={12}/> ARREMATADO!</span>
                            : <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">PERDIDO</span>;
                    } else {
                        statusBadge = estouGanhando
                            ? <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">VENCENDO</span>
                            : <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">SUPERADO</span>;
                    }

                    return (
                      <div key={l.id} className={`bg-white border p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 transition-colors ${estouGanhando && !encerrado ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200'}`}>
                        <div className="flex gap-4 items-center">
                          <img src={l.foto} className="w-16 h-16 object-cover rounded-lg bg-gray-100" alt="Thumb" />
                          <div>
                            <h4 className="font-bold text-base text-gray-900 line-clamp-1">{l.item}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                {statusBadge}
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1"><Clock size={12}/> {formatarTempo(l.termino)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center items-end md:text-right text-sm">
                          <p className="text-gray-600">Seu lance: <span className="font-bold text-gray-900">{formatarMoeda(meuUltimoLance.valor)}</span></p>
                          <p className="text-gray-500 mt-1">Valor Atual: <span className="font-bold text-blue-900">{formatarMoeda(l.valorAtual)}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Simples */}
      <footer className="bg-white py-6 text-center text-gray-500 text-sm border-t border-gray-200">
        <p>© 2024 LancePrime. Todos os direitos reservados.</p>
      </footer>

      {/* Menu Inferior de Navegação */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center relative">
          <button onClick={() => setPagina('home')} className={`flex flex-col items-center p-2 w-16 rounded-xl transition-colors ${pagina === 'home' ? 'text-blue-700 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <Home size={24} strokeWidth={pagina === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1">Início</span>
          </button>
          
          <button onClick={() => setPagina('criar')} className="flex flex-col items-center relative -top-5 p-1">
            <div className={`rounded-full p-3 shadow-lg transition-all ${pagina === 'criar' ? 'bg-blue-700 text-white ring-4 ring-blue-100 scale-110' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'}`}>
              <PlusCircle size={28} strokeWidth={2.5} />
            </div>
          </button>

          <button onClick={() => setPagina('perfil')} className={`flex flex-col items-center p-2 w-16 rounded-xl transition-colors ${pagina === 'perfil' ? 'text-blue-700 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <LayoutDashboard size={24} strokeWidth={pagina === 'perfil' ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1">Painel</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
