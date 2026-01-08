import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign, ShieldCheck, Award, LogOut, Phone, FileText } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// URL DO BACKEND
const socket = io('https://duckhuntbet.onrender.com');

function App() {
  // --- ESTADOS DE DADOS ---
  const [leiloes, setLeiloes] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  
  // --- ESTADO DE NAVEGAÇÃO E USUÁRIO ---
  const [pagina, setPagina] = useState('home');
  const [user, setUser] = useState(null); // Agora começa nulo (deslogado)
  
  // Estado do Formulário de Login
  const [loginForm, setLoginForm] = useState({ nome: '', whatsapp: '', cpf: '' });

  // Estado do Formulário de Novo Leilão
  const [novoItem, setNovoItem] = useState({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '' });

  useEffect(() => {
    socket.on('update_lista', (data) => setLeiloes(data));
    
    socket.on('notificacao', (data) => {
      if (data.tipo === 'success') toast.success(data.msg);
      else if (data.tipo === 'warning') toast.warn(data.msg);
      else toast.info(data.msg);
    });

    // Tenta recuperar usuário salvo no navegador (opcional, para não perder login ao atualizar)
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

  // --- FUNÇÕES DE AÇÃO ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginForm.nome || !loginForm.whatsapp || !loginForm.cpf) {
      toast.error("Preencha todos os campos!");
      return;
    }
    // Salva o usuário
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
    // Envia o nome real do usuário
    socket.emit('dar_lance', { idLeilao: leilao.id, valor: valorLance, usuario: user.nome });
  };

  const criarLeilao = (e) => {
    e.preventDefault();
    socket.emit('criar_leilao', { ...novoItem, usuario: user.nome });
    setNovoItem({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '' });
    setPagina('home');
  };

  // --- FORMATAÇÃO ---
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

  // --- TELA DE LOGIN (Renderizada se não houver user) ---
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
          <p className="text-center text-xs text-gray-400 mt-6">Seus dados estão seguros e serão usados apenas para identificação nos lances.</p>
        </div>
      </div>
    );
  }

  // --- SISTEMA PRINCIPAL (Renderizado se houver user) ---
  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans text-gray-900">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xl md:text-2xl tracking-tight">
            <Gavel className="text-blue-600" size={24} /> 
            <span className="hidden md:inline">LANCE<span className="text-blue-600">PRIME</span></span>
            <span className="md:hidden">LP</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-200">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-700">
                <User size={16} />
              </div>
              <span className="font-semibold text-sm text-gray-700 max-w-[100px] truncate">{user.nome}</span>
            </div>
            
            {/* BOTÃO DE SAIR */}
            <button onClick={handleLogout} className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* --- PÁGINA: HOME --- */}
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
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{leilao.item}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{leilao.descricao}</p>
                      
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
                        {encerrado ? "LEILÃO ENCERRADO" : `LANCE (+${formatarMoeda(leilao.incrementoMinimo)})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- PÁGINA: CRIAR --- */}
        {pagina === 'criar' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b border-gray-100">
              <PlusCircle className="text-blue-600" size={28} /> Publicar Item
            </h2>
            <form onSubmit={criarLeilao} className="space-y-6">
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
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-4">
                PUBLICAR AGORA
              </button>
            </form>
          </div>
        )}

        {/* --- PÁGINA: PERFIL --- */}
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

      {/* Menu Inferior */}
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
