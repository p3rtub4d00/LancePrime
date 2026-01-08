import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign, ShieldCheck, Award, LogOut, Phone, FileText, Star, X, QrCode, MapPin, Truck, MessageCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('https://duckhuntbet.onrender.com');

function App() {
  const [leiloes, setLeiloes] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  const [pagina, setPagina] = useState('home');
  const [user, setUser] = useState(null); // Usuário logado
  
  // MODAIS
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);

  // FORMULÁRIOS
  const [loginForm, setLoginForm] = useState({ nome: '', whatsapp: '', cpf: '' });
  const [novoItem, setNovoItem] = useState({ 
    titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false,
    localizacao: '', frete: 'retirada' 
  });

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

  // --- AÇÕES ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginForm.nome || !loginForm.whatsapp || !loginForm.cpf) return toast.error("Preencha tudo!");
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
    // Envia nome E whatsapp do comprador
    socket.emit('dar_lance', { idLeilao: leilao.id, valor: valorLance, usuario: user.nome, whatsapp: user.whatsapp });
  };

  const tentarCriarLeilao = (e) => {
    e.preventDefault();
    if (novoItem.destaque) setModalPagamento(true);
    else finalizarPublicacao();
  };

  const finalizarPublicacao = () => {
    // Envia o leilão com os dados do vendedor (incluindo whatsapp para o ganhador chamar depois)
    socket.emit('criar_leilao', { ...novoItem, usuario: user.nome, whatsapp: user.whatsapp });
    setNovoItem({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false, localizacao: '', frete: 'retirada' });
    setModalPagamento(false);
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

  const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- COMPONENTE: BOTÃO DE WHATSAPP (PÓS-VENDA) ---
  const BotaoContato = ({ leilao, tipo }) => {
    if (!user) return null;
    
    // Se eu ganhei, chamo o vendedor
    if (tipo === 'ganhador') {
        const msg = `Olá! Ganhei o leilão do *${leilao.item}* por ${formatarMoeda(leilao.valorAtual)}. Como faço o pagamento e a retirada?`;
        const link = `https://wa.me/${leilao.whatsapp}?text=${encodeURIComponent(msg)}`;
        return (
            <a href={link} target="_blank" className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 mt-2">
                <MessageCircle size={20}/> COMBINAR PAGAMENTO E ENTREGA
            </a>
        );
    }
    // Se eu vendi, chamo o ganhador (pegamos o whats do primeiro lance da lista, que é o vencedor)
    if (tipo === 'vendedor' && leilao.lances.length > 0) {
        const ganhador = leilao.lances[0];
        const msg = `Olá ${ganhador.usuario}! Parabéns por arrematar o *${leilao.item}*. Vamos combinar a entrega?`;
        const link = `https://wa.me/${ganhador.whatsapp}?text=${encodeURIComponent(msg)}`;
        return (
            <a href={link} target="_blank" className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-center text-sm flex items-center justify-center gap-2 mt-2">
                <MessageCircle size={16}/> CHAMAR GANHADOR NO ZAP
            </a>
        );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans text-gray-900">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* MODAL DE LOGIN (Só aparece quando chamado) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400"><X/></button>
              <h2 className="text-2xl font-bold mb-1 text-center">Identifique-se</h2>
              <p className="text-gray-500 text-center mb-6 text-sm">Para garantir a segurança, precisamos saber quem dá os lances.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <input required className="w-full p-3 border rounded-xl" placeholder="Nome Completo" value={loginForm.nome} onChange={e => setLoginForm({...loginForm, nome: e.target.value})} />
                <input required type="tel" className="w-full p-3 border rounded-xl" placeholder="WhatsApp (com DDD)" value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
                <input required className="w-full p-3 border rounded-xl" placeholder="CPF" value={loginForm.cpf} onChange={e => setLoginForm({...loginForm, cpf: e.target.value})} />
                <button type="submit" className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl">ENTRAR</button>
              </form>
           </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xl md:text-2xl tracking-tight">
            <Gavel className="text-blue-600" size={24} /> 
            <span className="hidden md:inline">LANCE<span className="text-blue-600">PRIME</span></span>
            <span className="md:hidden">LP</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                <ShieldCheck size={14} /> <span>Ambiente Seguro</span>
            </div>

            {user ? (
              <>
                <div className="flex items-center gap-2 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-200">
                  <div className="bg-blue-100 p-1.5 rounded-full text-blue-700"><User size={16} /></div>
                  <span className="font-semibold text-sm text-gray-700 max-w-[100px] truncate">{user.nome}</span>
                </div>
                <button onClick={handleLogout} className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100"><LogOut size={20} /></button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-700">
                ENTRAR
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* --- HOME (VITRINE) --- */}
        {pagina === 'home' && (
          <div className="space-y-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Award className="text-blue-600"/> Leilões Ativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leiloes.map((leilao) => {
                const status = formatarTempo(leilao.termino);
                const encerrado = status === "ENCERRADO";
                const euGanhei = encerrado && user && leilao.lances.length > 0 && leilao.lances[0].usuario === user.nome;

                return (
                  <div key={leilao.id} className={`bg-white rounded-2xl hover:shadow-md transition-all overflow-hidden group border ${leilao.destaque ? 'border-yellow-400 shadow-yellow-100' : 'border-gray-200'}`}>
                    <div className="relative">
                      <img src={leilao.foto} className="w-full h-56 object-cover" alt="Item" />
                      {leilao.destaque && <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full flex gap-1"><Star size={12}/> PREMIUM</div>}
                      <div className="absolute top-3 right-3 bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex gap-1"><Clock size={14}/> {status}</div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{leilao.item}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><MapPin size={12}/> {leilao.localizacao}</span>
                        <span className="flex items-center gap-1"><Truck size={12}/> {leilao.frete}</span>
                      </div>
                      
                      <div className={`p-4 rounded-xl mb-4 ${leilao.destaque ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Valor Atual</p>
                        <p className={`text-2xl font-black ${leilao.destaque ? 'text-yellow-700' : 'text-blue-900'}`}>{formatarMoeda(leilao.valorAtual)}</p>
                        {leilao.lances.length > 0 && <div className="mt-2 text-xs text-gray-500">Último: <b>{leilao.lances[0].usuario}</b></div>}
                      </div>

                      {encerrado ? (
                        euGanhei ? (
                           <BotaoContato leilao={leilao} tipo="ganhador" />
                        ) : (
                           <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-3 rounded-xl cursor-not-allowed">LEILÃO ENCERRADO</button>
                        )
                      ) : (
                        <button onClick={() => enviarLance(leilao)} className={`w-full text-white font-bold py-3 rounded-xl ${leilao.destaque ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-700 hover:bg-blue-800'}`}>
                           LANCE (+{formatarMoeda(leilao.incrementoMinimo)})
                        </button>
                      )}
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
             {/* Verifica login antes de mostrar o form */}
             {!verificarAcaoRestrita() ? (
                <div className="text-center py-10">
                    <p>Carregando login...</p>
                </div>
             ) : (
                 <>
                    {/* MODAL PAGAMENTO (MOCK) */}
                    {modalPagamento && (
                        <div className="absolute inset-0 bg-white/95 z-40 rounded-2xl flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                            <button onClick={() => setModalPagamento(false)} className="absolute top-4 right-4 text-gray-400"><X/></button>
                            <div className="text-center max-w-sm w-full">
                                <QrCode size={100} className="mx-auto mb-4 text-gray-800"/>
                                <h3 className="font-bold text-lg">Pagar Destaque (R$ 19,90)</h3>
                                <button onClick={finalizarPublicacao} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-4">Simular Pagamento OK</button>
                            </div>
                        </div>
                    )}

                    <h2 className="text-2xl font-bold mb-6">Novo Leilão</h2>
                    <form onSubmit={tentarCriarLeilao} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="label">Título</label>
                            <input required className="input" value={novoItem.titulo} onChange={e => setNovoItem({...novoItem, titulo: e.target.value})} placeholder="Ex: Celta 2010" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Descrição</label>
                            <textarea required className="input resize-none" rows="3" value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} placeholder="Detalhes..." />
                        </div>
                        
                        {/* NOVOS CAMPOS DE LOGÍSTICA */}
                        <div>
                            <label className="label">Cidade/Estado</label>
                            <input required className="input" value={novoItem.localizacao} onChange={e => setNovoItem({...novoItem, localizacao: e.target.value})} placeholder="Ex: Curitiba, PR" />
                        </div>
                        <div>
                            <label className="label">Entrega</label>
                            <select className="input" value={novoItem.frete} onChange={e => setNovoItem({...novoItem, frete: e.target.value})}>
                                <option value="retirada">Somente Retirada</option>
                                <option value="correios">Envio Correios/Transp.</option>
                                <option value="ambos">Retirada ou Envio</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Valor Inicial (R$)</label>
                            <input required type="number" className="input" value={novoItem.valorInicial} onChange={e => setNovoItem({...novoItem, valorInicial: e.target.value})} />
                        </div>
                        <div>
                            <label className="label">Incremento (R$)</label>
                            <input required type="number" className="input" value={novoItem.incremento} onChange={e => setNovoItem({...novoItem, incremento: e.target.value})} />
                        </div>
                        <div>
                            <label className="label">Tempo (Minutos)</label>
                            <input required type="number" className="input" value={novoItem.minutos} onChange={e => setNovoItem({...novoItem, minutos: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Foto URL</label>
                            <input required type="url" className="input" value={novoItem.foto} onChange={e => setNovoItem({...novoItem, foto: e.target.value})} />
                        </div>

                        <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl flex items-center gap-4 cursor-pointer border border-yellow-200" onClick={() => setNovoItem({...novoItem, destaque: !novoItem.destaque})}>
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${novoItem.destaque ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-gray-300'}`}>
                                {novoItem.destaque && <Star size={14} className="text-white"/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-800">Destaque Premium (R$ 19,90)</h4>
                                <p className="text-xs text-yellow-700">Apareça no topo com destaque.</p>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-4">PUBLICAR</button>
                    </form>
                 </>
             )}
          </div>
        )}

        {/* --- PAINEL (MEUS DADOS CORRIGIDOS) --- */}
        {pagina === 'perfil' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h2 className="text-2xl font-bold mb-6">Painel de {user.nome}</h2>
               
               {/* O QUE EU ESTOU VENDENDO */}
               <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign size={20}/> Meus Produtos à Venda</h3>
               <div className="space-y-3 mb-8">
                   {leiloes.filter(l => l.dono === user.nome).length === 0 ? <p className="text-gray-400">Nada anunciado.</p> : 
                    leiloes.filter(l => l.dono === user.nome).map(l => (
                       <div key={l.id} className="border p-4 rounded-xl">
                           <div className="flex justify-between font-bold">
                               <span>{l.item}</span>
                               <span>{formatarMoeda(l.valorAtual)}</span>
                           </div>
                           <div className="text-sm text-gray-500 mt-1">Status: {formatarTempo(l.termino)}</div>
                           {/* SE ACABOU E TEM LANCES, MOSTRA BOTÃO DE COBRAR */}
                           {formatarTempo(l.termino) === "ENCERRADO" && l.lances.length > 0 && (
                               <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100">
                                   <p className="text-green-800 font-bold text-sm mb-2">Vendido para {l.lances[0].usuario}!</p>
                                   <BotaoContato leilao={l} tipo="vendedor" />
                               </div>
                           )}
                       </div>
                    ))
                   }
               </div>

               {/* ONDE EU DEI LANCE */}
               <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Gavel size={20}/> Minhas Apostas</h3>
               <div className="space-y-3">
                   {/* Filtra leilões onde meu nome aparece na lista de lances */}
                   {leiloes.filter(l => l.lances.some(lance => lance.usuario === user.nome)).length === 0 ? <p className="text-gray-400">Nenhum lance dado.</p> : 
                    leiloes.filter(l => l.lances.some(lance => lance.usuario === user.nome)).map(l => {
                        const meuUltimo = l.lances.find(la => la.usuario === user.nome);
                        const ganhando = l.lances[0].usuario === user.nome;
                        const encerrado = formatarTempo(l.termino) === "ENCERRADO";

                        return (
                           <div key={l.id} className={`border p-4 rounded-xl ${ganhando ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                               <div className="flex justify-between font-bold">
                                   <span>{l.item}</span>
                                   <span className={ganhando ? 'text-blue-600' : 'text-red-500'}>
                                       {encerrado ? (ganhando ? "GANHEI!" : "PERDI") : (ganhando ? "GANHANDO" : "SUPERADO")}
                                   </span>
                               </div>
                               <div className="text-sm mt-1">Meu lance: {formatarMoeda(meuUltimo.valor)}</div>
                               
                               {encerrado && ganhando && (
                                   <BotaoContato leilao={l} tipo="ganhador" />
                               )}
                           </div>
                        );
                    })
                   }
               </div>
            </div>
          </div>
        )}

      </main>

      {/* MENU MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 z-30 flex justify-around">
          <NavBtn icon={Home} label="Início" active={pagina==='home'} onClick={()=>setPagina('home')}/>
          <div className="relative -top-5"><button onClick={()=> user ? setPagina('criar') : setShowLoginModal(true)} className="bg-blue-600 text-white p-3 rounded-full shadow-lg"><PlusCircle size={28}/></button></div>
          <NavBtn icon={LayoutDashboard} label="Painel" active={pagina==='perfil'} onClick={()=> user ? setPagina('perfil') : setShowLoginModal(true)}/>
      </nav>
      
      {/* CSS Utility classes for clean code */}
      <style>{`.label { @apply block text-sm font-bold text-gray-700 mb-2 } .input { @apply w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 }`}</style>
    </div>
  );
}

const NavBtn = ({icon: Icon, label, active, onClick}) => (
    <button onClick={onClick} className={`flex flex-col items-center w-16 ${active ? 'text-blue-700' : 'text-gray-400'}`}>
        <Icon size={24} strokeWidth={active?2.5:2}/>
        <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
);

export default App;
