import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign, ShieldCheck, Award, LogOut, Phone, FileText, Star, X, QrCode } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// URL DO BACKEND
const socket = io('https://duckhuntbet.onrender.com');

function App() {
  const [leiloes, setLeiloes] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  const [pagina, setPagina] = useState('home');
  const [user, setUser] = useState(null);
  
  // LOGIN
  const [loginForm, setLoginForm] = useState({ nome: '', whatsapp: '', cpf: '' });

  // NOVO LEILÃO
  const [novoItem, setNovoItem] = useState({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false });

  // PAGAMENTO (MOCK)
  const [modalPagamento, setModalPagamento] = useState(false);

  useEffect(() => {
    socket.on('update_lista', (data) => setLeiloes(data));
    
    socket.on('notificacao', (data) => {
      if (data.tipo === 'success') toast.success(data.msg);
      else if (data.tipo === 'warning') toast.warn(data.msg);
      else toast.info(data.msg);
    });

    const salvo = localStorage.getItem('lanceprime_user');
    if (salvo) setUser(JSON.parse(salvo));

    return () => {
      socket.off('update_lista');
      socket.off('notificacao');
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- AÇÕES ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginForm.nome || !loginForm.whatsapp || !loginForm.cpf) {
      toast.error("Preencha todos os campos!");
      return;
    }
    setUser(loginForm);
    localStorage.setItem('lanceprime_user', JSON.stringify(loginForm));
    toast.success(`Bem-vindo, ${loginForm.nome}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lanceprime_user');
    setPagina('home');
    toast.info("Você saiu do sistema.");
  };

  const enviarLance = (leilao) => {
    const valorLance = leilao.valorAtual + leilao.incrementoMinimo;
    socket.emit('dar_lance', { idLeilao: leilao.id, valor: valorLance, usuario: user.nome });
  };

  const tentarCriarLeilao = (e) => {
    e.preventDefault();
    
    // Se escolheu destaque, abre o modal de pagamento PRIMEIRO
    if (novoItem.destaque) {
      setModalPagamento(true);
    } else {
      // Se for grátis, publica direto
      finalizarPublicacao();
    }
  };

  const simularPagamentoAprovado = () => {
    toast.success("Pagamento via Pix confirmado! 🚀");
    setModalPagamento(false);
    finalizarPublicacao();
  };

  const finalizarPublicacao = () => {
    socket.emit('criar_leilao', { ...novoItem, usuario: user.nome });
    setNovoItem({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false });
    setPagina('home');
  };

  // --- FORMATADORES ---
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

  // --- TELA DE LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <ToastContainer position="top-center" theme="colored" />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-blue-900 font-extrabold text-3xl tracking-tight mb-2">
              <Gavel className="text-blue-600" size={32} /> 
              <span>LANCE<span className="text-blue-600">PRIME</span></span>
            </div>
            <p className="text-gray-500">Entre para participar dos leilões em tempo real.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="Seu nome"
                  value={loginForm.nome} onChange={e => setLoginForm({...loginForm, nome: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required type="tel" className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="(00) 00000-0000"
                  value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CPF</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="000.000.000-00"
                  value={loginForm.cpf} onChange={e => setLoginForm({...loginForm, cpf: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] mt-4">
              ENTRAR NO SISTEMA
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- SISTEMA ---
  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans text-gray-900">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xl md:text-2xl tracking-tight">
            <Gavel className="text-blue-600" size={24} /> 
            <span className="hidden md:inline">LANCE<span className="text-blue-600">PRIME</span></span>
            <span className="md:hidden">LP</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* SELO DE SEGURANÇA (VOLTOU) */}
            <div className="hidden md:flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                <ShieldCheck size={14} /> <span>Ambiente Seguro</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-200">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-700">
                <User size={16} />
              </div>
              <span className="font-semibold text-sm text-gray-700 max-w-[100px] truncate">{user.nome}</span>
            </div>
            
            <button onClick={handleLogout} className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* --- HOME --- */}
        {pagina === 'home' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="text-blue-600" size={24} /> Leilões em Destaque
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leiloes.map((leilao) => {
                const status = formatarTempo(leilao.termino);
                const encerrado = status === "ENCERRADO";

                // ESTILO PARA ITEM PREMIUM (DESTAQUE)
                const cardStyle = leilao.destaque 
                  ? "border-2 border-yellow-400 shadow-yellow-100 shadow-lg" 
                  : "border border-gray-200 shadow-sm";

                return (
                  <div key={leilao.id} className={`bg-white rounded-2xl hover:shadow-md transition-all overflow-hidden group ${cardStyle}`}>
                    <div className="relative">
                      <img src={leilao.foto} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" alt="Item" />
                      
                      {/* Selo Destaque */}
                      {leilao.destaque && (
                        <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <Star size={12} fill="currentColor" /> PREMIUM
                        </div>
                      )}

                      <div className="absolute top-3 right-3">
                        <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${encerrado ? 'bg-red-100 text-red-700' : 'bg-white text-blue-700'}`}>
                          <Clock size={14} /> {status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{leilao.item}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{leilao.descricao}</p>
                      
                      <div className={`p-4 rounded-xl mb-4 ${leilao.destaque ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Lance Atual</p>
                        <p className={`text-2xl font-black ${leilao.destaque ? 'text-yellow-700' : 'text-blue-900'}`}>{formatarMoeda(leilao.valorAtual)}</p>
                        {leilao.lances.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1 truncate">
                            <User size={12}/> Último: <span className="font-semibold">{leilao.lances[0].usuario}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => enviarLance(leilao)}
                        disabled={encerrado}
                        className={`w-full font-bold py-3 rounded-xl transition-all disabled:bg-gray-300 disabled:text-gray-500 active:scale-[0.98]
                            ${leilao.destaque ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                      >
                        {encerrado ? "ENCERRADO" : `LANCE (+${formatarMoeda(leilao.incrementoMinimo)})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- CRIAR LEILÃO --- */}
        {pagina === 'criar' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative">
            
            {/* MODAL PAGAMENTO (Simulação) */}
            {modalPagamento && (
                <div className="absolute inset-0 bg-white/95 z-50 rounded-2xl flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-in fade-in">
                    <button onClick={() => setModalPagamento(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 text-center max-w-sm w-full">
                        <div className="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode size={32}/>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Pagar Destaque</h3>
                        <p className="text-sm text-gray-500 mb-6">Escaneie o QR Code abaixo no app do seu banco para destacar seu anúncio.</p>
                        
                        {/* QR CODE FAKE */}
                        <div className="bg-gray-900 p-4 rounded-xl mb-6 mx-auto w-48 h-48 flex items-center justify-center">
                            <QrCode size={100} className="text-white opacity-50"/>
                        </div>
                        
                        <p className="font-mono text-xl font-bold text-gray-900 mb-6">R$ 19,90</p>

                        <button onClick={simularPagamentoAprovado} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
                            Simular Pagamento Aprovado
                        </button>
                        <p className="text-[10px] text-gray-400 mt-3">Ambiente de Testes - Mercado Pago API</p>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b border-gray-100">
              <PlusCircle className="text-blue-600" size={28} /> Publicar Item
            </h2>
            <form onSubmit={tentarCriarLeilao} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Título do Anúncio</label>
                  <input required className="w-full p-3 border border-gray-300 rounded-xl" placeholder="Ex: iPhone 15" 
                    value={novoItem.titulo} onChange={e => setNovoItem({...novoItem, titulo: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                  <textarea required rows="3" className="w-full p-3 border border-gray-300 rounded-xl resize-none" placeholder="Detalhes..." 
                    value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Valor Inicial (R$)</label>
                  <input required type="number" className="w-full p-3 border border-gray-300 rounded-xl" placeholder="0,00"
                    value={novoItem.valorInicial} onChange={e => setNovoItem({...novoItem, valorInicial: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Incremento (R$)</label>
                  <input required type="number" className="w-full p-3 border border-gray-300 rounded-xl" placeholder="Ex: 50,00"
                    value={novoItem.incremento} onChange={e => setNovoItem({...novoItem, incremento: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tempo (Minutos)</label>
                  <input required type="number" className="w-full p-3 border border-gray-300 rounded-xl" placeholder="10" 
                    value={novoItem.minutos} onChange={e => setNovoItem({...novoItem, minutos: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Link da Foto</label>
                  <input required type="url" className="w-full p-3 border border-gray-300 rounded-xl" placeholder="https://..." 
                    value={novoItem.foto} onChange={e => setNovoItem({...novoItem, foto: e.target.value})} />
                </div>

                {/* OPÇÃO DE DESTAQUE */}
                <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-yellow-100 transition-colors"
                     onClick={() => setNovoItem({...novoItem, destaque: !novoItem.destaque})}>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${novoItem.destaque ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300 bg-white'}`}>
                        {novoItem.destaque && <Star size={14} className="text-white" fill="currentColor"/>}
                    </div>
                    <div>
                        <h4 className="font-bold text-yellow-800 flex items-center gap-2">
                            Quero Destaque Premium <span className="bg-yellow-200 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full">RECOMENDADO</span>
                        </h4>
                        <p className="text-sm text-yellow-700">Seu anúncio aparece no topo com borda dourada por apenas <b>R$ 19,90</b></p>
                    </div>
                </div>

              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-4">
                {novoItem.destaque ? 'IR PARA PAGAMENTO' : 'PUBLICAR GRÁTIS'}
              </button>
            </form>
          </div>
        )}

        {/* --- PERFIL --- */}
        {pagina === 'perfil' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                 <div className="bg-blue-100 p-4 rounded-full text-blue-700">
                   <User size={32} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-gray-900">{user.nome}</h2>
                   <p className="text-gray-500">{user.whatsapp} • {user.cpf}</p>
                 </div>
               </div>
               
               <h3 className="font-bold text-gray-900 mb-4">Meus Lances</h3>
               {leiloes.filter(l => l.lances.some(lance => lance.usuario === user.nome)).length === 0 ? (
                 <p className="text-gray-400">Nenhum lance registrado.</p>
               ) : (
                 <div className="space-y-3">
                   {leiloes.filter(l => l.lances.some(lance => lance.usuario === user.nome)).map(l => (
                     <div key={l.id} className="flex justify-between p-3 bg-gray-50 rounded-lg border">
                       <span className="font-medium">{l.item}</span>
                       <span className="font-bold text-blue-600">{formatarMoeda(l.lances.find(la => la.usuario === user.nome).valor)}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

      </main>

      {/* MENU INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button onClick={() => setPagina('home')} className={`flex flex-col items-center p-2 w-16 rounded-xl ${pagina === 'home' ? 'text-blue-700 bg-blue-50' : 'text-gray-400'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold mt-1">Início</span>
          </button>
          <button onClick={() => setPagina('criar')} className="flex flex-col items-center relative -top-5">
            <div className={`rounded-full p-3 shadow-lg ${pagina === 'criar' ? 'bg-blue-700 text-white ring-4 ring-blue-100' : 'bg-blue-600 text-white'}`}>
              <PlusCircle size={28} />
            </div>
          </button>
          <button onClick={() => setPagina('perfil')} className={`flex flex-col items-center p-2 w-16 rounded-xl ${pagina === 'perfil' ? 'text-blue-700 bg-blue-50' : 'text-gray-400'}`}>
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold mt-1">Painel</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
