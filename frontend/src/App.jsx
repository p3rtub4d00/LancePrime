import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign, ShieldCheck, Award, LogOut, Phone, FileText, Star, X, QrCode, MapPin, Truck, MessageCircle, Image as ImageIcon, AlignLeft, Tag, Timer, Info, CheckCircle, Hourglass } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// CONEXÃO COM O BACKEND
const socket = io('https://duckhuntbet.onrender.com');

function App() {
  const [leiloes, setLeiloes] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  const [pagina, setPagina] = useState('home');
  const [user, setUser] = useState(null);
  
  // MODAIS
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false); // Para Destaque
  const [modalPagamentoVencedor, setModalPagamentoVencedor] = useState(null); // Para o Ganhador (guarda o leilão)

  // DADOS DOS FORMULÁRIOS
  const [loginForm, setLoginForm] = useState({ nome: '', whatsapp: '', cpf: '' });
  const [novoItem, setNovoItem] = useState({ 
    titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false,
    localizacao: '', frete: 'retirada' 
  });

  const TAXA_COMISSAO = 0.05;

  useEffect(() => {
    socket.on('update_lista', (data) => setLeiloes(data));
    socket.on('notificacao', (data) => {
      if (data.tipo === 'success') toast.success(data.msg);
      else if (data.tipo === 'warning') toast.warn(data.msg);
      else toast.info(data.msg);
    });
    const salvo = localStorage.getItem('lanceprime_user');
    if (salvo) setUser(JSON.parse(salvo));
    return () => { socket.off('update_lista'); socket.off('notificacao'); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LÓGICA ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginForm.nome || !loginForm.whatsapp || !loginForm.cpf) return toast.error("Preencha todos os campos!");
    setUser(loginForm);
    localStorage.setItem('lanceprime_user', JSON.stringify(loginForm));
    setShowLoginModal(false);
    toast.success("Login realizado!");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lanceprime_user');
    setPagina('home');
  };

  const verificarAcaoRestrita = () => {
    if (!user) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const enviarLance = (leilao) => {
    if (!verificarAcaoRestrita()) return;
    const valorLance = leilao.valorAtual + leilao.incrementoMinimo;
    socket.emit('dar_lance', { idLeilao: leilao.id, valor: valorLance, usuario: user.nome, whatsapp: user.whatsapp });
  };

  const tentarCriarLeilao = (e) => {
    e.preventDefault();
    if (novoItem.destaque) setModalPagamento(true);
    else finalizarPublicacao();
  };

  const finalizarPublicacao = () => {
    socket.emit('criar_leilao', { ...novoItem, usuario: user.nome, whatsapp: user.whatsapp });
    setNovoItem({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false, localizacao: '', frete: 'retirada' });
    setModalPagamento(false);
    setPagina('home');
    toast.success("Anúncio publicado!");
  };

  // --- NOVO: LÓGICA DO VENCEDOR ---
  const confirmarPagamentoVencedor = () => {
    if (modalPagamentoVencedor) {
        socket.emit('enviar_comprovante', { idLeilao: modalPagamentoVencedor.id });
        setModalPagamentoVencedor(null);
        toast.success("Comprovante enviado! Aguarde aprovação.");
    }
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

  const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- COMPONENTE INTELIGENTE DE CONTATO ---
  const BotaoAcaoVencedor = ({ leilao }) => {
    if (!user) return null;

    // Status: pendente (Pagar) -> analise (Esperar) -> aprovado (WhatsApp)
    const status = leilao.statusPagamento || 'pendente';

    if (status === 'pendente') {
        return (
            <button onClick={() => setModalPagamentoVencedor(leilao)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 mt-2 flex items-center justify-center gap-2 animate-pulse">
                <QrCode size={20}/> PAGAR AGORA (PIX)
            </button>
        );
    }
    
    if (status === 'analise') {
        return (
            <button disabled className="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl border border-gray-200 mt-2 flex items-center justify-center gap-2 cursor-wait">
                <Hourglass size={20}/> PAGAMENTO EM ANÁLISE
            </button>
        );
    }

    if (status === 'aprovado') {
        const msg = `Olá! Meu pagamento do *${leilao.item}* foi aprovado. Podemos combinar a entrega?`;
        return (
            <a href={`https://wa.me/${leilao.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 mt-2">
                <MessageCircle size={20}/> COMBINAR ENTREGA
            </a>
        );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* --- MODAIS --- */}

      {/* 1. LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-5 right-5 text-gray-400"><X/></button>
              <div className="text-center mb-6">
                 <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><User size={32} /></div>
                 <h2 className="text-2xl font-extrabold text-gray-900">Identifique-se</h2>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <input required className="w-full p-3.5 bg-gray-50 border rounded-xl" placeholder="Nome Completo" value={loginForm.nome} onChange={e => setLoginForm({...loginForm, nome: e.target.value})} />
                <input required type="tel" className="w-full p-3.5 bg-gray-50 border rounded-xl" placeholder="WhatsApp" value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
                <input required className="w-full p-3.5 bg-gray-50 border rounded-xl" placeholder="CPF" value={loginForm.cpf} onChange={e => setLoginForm({...loginForm, cpf: e.target.value})} />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">ENTRAR AGORA</button>
              </form>
           </div>
        </div>
      )}

      {/* 2. PAGAMENTO DESTAQUE (Vendedor) */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl">
                <button onClick={() => setModalPagamento(false)} className="absolute top-4 right-4 text-gray-400"><X/></button>
                <div className="mb-6 inline-block p-4 bg-green-50 rounded-full text-green-600"><QrCode size={48}/></div>
                <h3 className="font-bold text-2xl text-gray-900 mb-2">Pagar Destaque</h3>
                <div className="bg-gray-100 p-4 rounded-xl mb-6 font-mono text-xs text-gray-500 break-all border border-dashed border-gray-300">
                    00020126580014BR.GOV.BCB.PIX0136123e4567-DESTAQUE-1990
                </div>
                <button onClick={finalizarPublicacao} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl">Confirmar Pagamento</button>
            </div>
        </div>
      )}

      {/* 3. PAGAMENTO VENCEDOR (Novo!) */}
      {modalPagamentoVencedor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative shadow-2xl">
                <button onClick={() => setModalPagamentoVencedor(null)} className="absolute top-4 right-4 text-gray-400"><X/></button>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                    <img src="https://img.icons8.com/color/48/mercado-pago.png" alt="MP" className="w-8 h-8"/>
                    <span className="font-bold text-gray-500 text-sm">Mercado Pago</span>
                </div>
                
                <h3 className="font-bold text-2xl text-gray-900 mb-1">Pagar Arremate</h3>
                <p className="text-gray-500 text-sm mb-6">Escaneie para garantir seu produto.</p>
                
                <div className="bg-gray-900 p-4 rounded-2xl mb-4 inline-block">
                     <QrCode size={160} className="text-white"/>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-xl mb-6 border border-blue-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">Valor Total</p>
                    <p className="text-2xl font-black text-blue-900">{formatarMoeda(modalPagamentoVencedor.valorAtual)}</p>
                </div>

                <div className="space-y-3">
                    <button onClick={() => navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136123e4567-TESTE-WINNER")} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 text-sm">
                        Copiar Código Pix
                    </button>
                    <button onClick={confirmarPagamentoVencedor} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200">
                        JÁ FIZ O PIX / ENVIAR COMPROVANTE
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-4">Após o pagamento, o vendedor liberará a entrega.</p>
            </div>
        </div>
      )}

      {/* HEADER (Igual) */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xl tracking-tight cursor-pointer" onClick={() => setPagina('home')}>
            <Gavel className="text-blue-600" size={24} /> 
            <span className="hidden md:inline">LANCE<span className="text-blue-600">PRIME</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <ShieldCheck size={14} /> <span>Ambiente Seguro</span>
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 bg-gray-50 pl-1.5 pr-3 py-1 rounded-full border border-gray-200">
                    <div className="bg-white p-1 rounded-full text-blue-600 shadow-sm"><User size={14} /></div>
                    <span className="font-semibold text-xs text-gray-700 max-w-[80px] truncate">{user.nome.split(' ')[0]}</span>
                 </div>
                 <button onClick={handleLogout} className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors"><LogOut size={18} /></button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">Entrar</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* --- HOME --- */}
        {pagina === 'home' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Award className="text-blue-600"/> Destaques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leiloes.map((leilao) => {
                const status = formatarTempo(leilao.termino);
                const encerrado = status === "ENCERRADO";
                const euGanhei = encerrado && user && leilao.lances.length > 0 && leilao.lances[0].usuario === user.nome;

                return (
                  <div key={leilao.id} className={`bg-white rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden group border ${leilao.destaque ? 'border-amber-300 shadow-amber-100 ring-1 ring-amber-100' : 'border-gray-100 shadow-sm'}`}>
                    <div className="relative h-56 overflow-hidden">
                      <img src={leilao.foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Item" />
                      {leilao.destaque && <div className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full flex gap-1 items-center shadow-lg"><Star size={10} fill="currentColor"/> PREMIUM</div>}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex gap-1 items-center"><Clock size={12}/> {status}</div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md"><MapPin size={12}/> {leilao.localizacao || 'Brasil'}</div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md"><Truck size={12}/> {leilao.frete}</div>
                      </div>
                      
                      <div className={`p-4 rounded-xl mb-4 flex justify-between items-end ${leilao.destaque ? 'bg-amber-50/50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Lance Atual</p>
                            <p className={`text-2xl font-black ${leilao.destaque ? 'text-amber-600' : 'text-blue-900'}`}>{formatarMoeda(leilao.valorAtual)}</p>
                        </div>
                        {leilao.lances.length > 0 && <div className="text-right"><p className="text-[10px] text-gray-400">Último de</p><p className="text-xs font-bold text-gray-700 max-w-[80px] truncate">{leilao.lances[0].usuario}</p></div>}
                      </div>

                      {/* LÓGICA DO BOTÃO VENCEDOR */}
                      {encerrado ? (
                        euGanhei ? <BotaoAcaoVencedor leilao={leilao} /> : 
                        <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed text-sm">LEILÃO ENCERRADO</button>
                      ) : (
                        <button onClick={() => enviarLance(leilao)} className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${leilao.destaque ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                           <Gavel size={18}/> LANCE (+{formatarMoeda(leilao.incrementoMinimo)})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- CRIAR LEILÃO (MANTIDO) --- */}
        {pagina === 'criar' && (
          <div className="max-w-2xl mx-auto">
             {!verificarAcaoRestrita() ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100"><p className="text-gray-500">Aguardando identificação...</p></div>
             ) : (
                 <>
                    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
                            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200"><PlusCircle size={28} /></div>
                            <div><h2 className="text-2xl font-bold text-gray-900">Novo Leilão</h2><p className="text-gray-500 text-sm">Venda seus itens.</p></div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3 items-start">
                            <Info className="text-blue-500 mt-0.5 shrink-0" size={20}/>
                            <div><h4 className="font-bold text-blue-900 text-sm">Política de Venda</h4><p className="text-xs text-blue-700 mt-1">A publicação é gratuita. Cobramos uma <b>taxa de 5%</b> sobre o valor final.</p></div>
                        </div>
                        <form onSubmit={tentarCriarLeilao} className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Sobre o Produto</label>
                                <div className="relative group"><Tag className="absolute left-4 top-4 text-gray-400" size={20}/><input required className="w-full pl-12 p-4 bg-gray-50 border rounded-xl" value={novoItem.titulo} onChange={e => setNovoItem({...novoItem, titulo: e.target.value})} placeholder="Título" /></div>
                                <div className="relative group"><AlignLeft className="absolute left-4 top-4 text-gray-400" size={20}/><textarea required className="w-full pl-12 p-4 h-32 bg-gray-50 border rounded-xl resize-none" value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} placeholder="Descrição" /></div>
                                <div className="relative group"><ImageIcon className="absolute left-4 top-4 text-gray-400" size={20}/><input required type="url" className="w-full pl-12 p-4 bg-gray-50 border rounded-xl" value={novoItem.foto} onChange={e => setNovoItem({...novoItem, foto: e.target.value})} placeholder="URL Imagem" /></div>
                            </div>
                            <div className="pt-4 space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Regras</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group"><DollarSign className="absolute left-4 top-4 text-gray-400" size={20}/><input required type="number" className="w-full pl-12 p-4 bg-gray-50 border rounded-xl" value={novoItem.valorInicial} onChange={e => setNovoItem({...novoItem, valorInicial: e.target.value})} placeholder="Valor Inicial" /></div>
                                    <div className="relative group"><PlusCircle className="absolute left-4 top-4 text-gray-400" size={20}/><input required type="number" className="w-full pl-12 p-4 bg-gray-50 border rounded-xl" value={novoItem.incremento} onChange={e => setNovoItem({...novoItem, incremento: e.target.value})} placeholder="Incremento" /></div>
                                </div>
                                <div className="relative group"><Timer className="absolute left-4 top-4 text-gray-400" size={20}/><input required type="number" className="w-full pl-12 p-4 bg-gray-50 border rounded-xl" value={novoItem.minutos} onChange={e => setNovoItem({...novoItem, minutos: e.target.value})} placeholder="Duração (min)" /></div>
                            </div>
                            <div className="pt-4 space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Entrega</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group"><MapPin className="absolute left-4 top-4 text-gray-400" size={20}/><input required className="w-full pl-12 p-4 bg-gray-50 border rounded-xl" value={novoItem.localizacao} onChange={e => setNovoItem({...novoItem, localizacao: e.target.value})} placeholder="Cidade/UF" /></div>
                                    <div className="relative group"><Truck className="absolute left-4 top-4 text-gray-400" size={20}/><select className="w-full pl-12 p-4 bg-gray-50 border rounded-xl text-gray-600" value={novoItem.frete} onChange={e => setNovoItem({...novoItem, frete: e.target.value})}><option value="retirada">Somente Retirada</option><option value="correios">Envio Correios</option><option value="ambos">Retirada ou Envio</option></select></div>
                                </div>
                            </div>
                            <div onClick={() => setNovoItem({...novoItem, destaque: !novoItem.destaque})} className={`mt-6 p-6 rounded-2xl cursor-pointer border-2 flex items-center gap-5 relative overflow-hidden ${novoItem.destaque ? 'bg-amber-50 border-amber-400 shadow-lg' : 'bg-white border-gray-200'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${novoItem.destaque ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Star size={24} fill={novoItem.destaque ? "currentColor" : "none"}/></div>
                                <div><h4 className={`font-bold text-lg ${novoItem.destaque ? 'text-amber-900' : 'text-gray-700'}`}>Destaque Premium</h4><p className={`text-sm ${novoItem.destaque ? 'text-amber-700' : 'text-gray-500'}`}>Apareça no topo.</p></div>
                            </div>
                            <button type="submit" className={`w-full font-bold py-5 rounded-xl text-lg shadow-xl mt-4 ${novoItem.destaque ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>{novoItem.destaque ? 'PAGAR E PUBLICAR' : 'PUBLICAR ANÚNCIO'}</button>
                        </form>
                    </div>
                 </>
             )}
          </div>
        )}

        {/* --- PAINEL --- */}
        {pagina === 'perfil' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
               <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">Financeiro</h2>
               <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign size={20} className="text-blue-500"/> Minhas Vendas</h3>
               <div className="grid gap-4 mb-10">
                   {leiloes.filter(l => l.dono === user.nome).length === 0 ? <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed text-gray-400">Sem vendas.</div> : 
                    leiloes.filter(l => l.dono === user.nome).map(l => (
                       <div key={l.id} className="bg-white border border-gray-100 p-5 rounded-2xl">
                           <div className="flex justify-between items-start mb-4">
                               <div><div className="font-bold text-gray-900 text-lg">{l.item}</div><div className="text-sm text-gray-500 mt-1 flex gap-2"><Clock size={12}/> {formatarTempo(l.termino)}</div></div>
                               <div className="text-right"><div className="font-bold text-blue-900 text-xl">{formatarMoeda(l.valorAtual)}</div><div className="text-xs text-gray-400">Valor Bruto</div></div>
                           </div>
                           {l.lances.length > 0 && (
                               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                                   <div className="flex gap-4 text-sm">
                                       <div><span className="block text-gray-400 text-xs uppercase">Comissão (5%)</span><span className="font-bold text-red-500">- {formatarMoeda(l.valorAtual * TAXA_COMISSAO)}</span></div>
                                       <div className="w-px bg-gray-200"></div>
                                       <div><span className="block text-gray-400 text-xs uppercase">A Receber</span><span className="font-bold text-green-600">{formatarMoeda(l.valorAtual * 0.95)}</span></div>
                                   </div>
                               </div>
                           )}
                       </div>
                    ))
                   }
               </div>
               
               {/* MEUS LANCES (PAINEL) */}
               <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Gavel size={20} className="text-blue-500"/> Minhas Apostas</h3>
               <div className="grid gap-4">
                   {leiloes.filter(l => l.lances.some(lance => lance.usuario === user.nome)).length === 0 ? <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed text-gray-400">Sem apostas.</div> : 
                    leiloes.filter(l => l.lances.some(lance => lance.usuario === user.nome)).map(l => {
                        const meuUltimo = l.lances.find(la => la.usuario === user.nome);
                        const ganhando = l.lances[0].usuario === user.nome;
                        const encerrado = formatarTempo(l.termino) === "ENCERRADO";

                        return (
                           <div key={l.id} className={`border p-5 rounded-2xl flex justify-between items-center ${ganhando ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                               <div>
                                   <div className="font-bold text-gray-900">{l.item}</div>
                                   <div className="text-sm mt-1 text-gray-600">Meu lance: <b>{formatarMoeda(meuUltimo.valor)}</b></div>
                               </div>
                               <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${encerrado ? (ganhando ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : (ganhando ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700")}`}>
                                       {encerrado ? (ganhando ? "ARREMATADO!" : "PERDIDO") : (ganhando ? "VENCENDO" : "SUPERADO")}
                                    </span>
                                   {encerrado && ganhando && <div className="mt-2"><BotaoAcaoVencedor leilao={l} /></div>}
                               </div>
                           </div>
                        );
                    })
                   }
               </div>
            </div>
          </div>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-6 py-3 z-30 flex justify-around shadow-[0_-5px_15px_rgba(0,0,0,0.05)] safe-area-bottom">
          <NavBtn icon={Home} label="Início" active={pagina==='home'} onClick={()=>setPagina('home')}/>
          <div className="relative -top-8"><button onClick={()=> user ? setPagina('criar') : setShowLoginModal(true)} className="bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-300 hover:scale-110 transition-transform"><PlusCircle size={32}/></button></div>
          <NavBtn icon={LayoutDashboard} label="Painel" active={pagina==='perfil'} onClick={()=> user ? setPagina('perfil') : setShowLoginModal(true)}/>
      </nav>
    </div>
  );
}

const NavBtn = ({icon: Icon, label, active, onClick}) => (
    <button onClick={onClick} className={`flex flex-col items-center w-16 transition-colors ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
        <Icon size={26} strokeWidth={active?2.5:2} className={active ? "drop-shadow-sm" : ""}/>
        <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
);

export default App;
