import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, PlusCircle, Home, LayoutDashboard, DollarSign, ShieldCheck, Award, LogOut, Phone, FileText, Star, X, QrCode, MapPin, Truck, MessageCircle, Image as ImageIcon, AlignLeft, Tag, Timer, Info, CheckCircle, Hourglass, Lock, FileCheck, CreditCard, Receipt, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// CONEXÃO COM O BACKEND
const socket = io('https://duckhuntbet.onrender.com');

// COMPONENTE CARD DE LEILÃO
const CardLeilao = ({ leilao, user, agora, onLance, onPagar, onConfirmarEntrega, onReportarProblema }) => {
    const [valorManual, setValorManual] = useState('');
    const status = formatarTempo(leilao.termino, agora);
    const encerrado = status === "ENCERRADO";
    const euGanhei = encerrado && user && leilao.lances.length > 0 && leilao.lances[0].usuario === user.nome;
    const minimoNecessario = leilao.valorAtual + leilao.incrementoMinimo;

    useEffect(() => {
        setValorManual(minimoNecessario);
    }, [leilao.valorAtual]);

    return (
        <div className={`bg-white rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden group border ${leilao.destaque ? 'border-amber-300 shadow-amber-100 ring-1 ring-amber-100' : 'border-gray-100 shadow-sm'}`}>
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
                    <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Lance Atual</p><p className={`text-2xl font-black ${leilao.destaque ? 'text-amber-600' : 'text-blue-900'}`}>{formatarMoeda(leilao.valorAtual)}</p></div>
                    {leilao.lances.length > 0 && <div className="text-right"><p className="text-[10px] text-gray-400">Último de</p><p className="text-xs font-bold text-gray-700 max-w-[80px] truncate">{leilao.lances[0].usuario}</p></div>}
                </div>
                
                {encerrado ? (
                    euGanhei ? 
                        <BotaoAcaoVencedor 
                            leilao={leilao} 
                            onPagar={onPagar} 
                            onConfirmarEntrega={onConfirmarEntrega}
                            onReportarProblema={onReportarProblema}
                            user={user} 
                        /> : 
                        <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed text-sm">LEILÃO ENCERRADO</button>
                ) : (
                    <div className="flex gap-2">
                        <div className="relative w-full">
                            <span className="absolute left-3 top-3.5 text-gray-400 text-xs font-bold">R$</span>
                            <input 
                                type="number" 
                                value={valorManual} 
                                onChange={(e) => setValorManual(e.target.value)}
                                className="w-full pl-8 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button onClick={() => onLance(leilao, valorManual)} className={`px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-[0.95] ${leilao.destaque ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>LANCE</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// AUXILIARES
const formatarTempo = (termino, agora) => {
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

// BOTÃO VENCEDOR (Fluxo Completo: Pagar -> Esperar -> Confirmar Entrega)
const BotaoAcaoVencedor = ({ leilao, onPagar, onConfirmarEntrega, onReportarProblema, user }) => {
    if (!user) return null;
    const status = leilao.statusPagamento || 'pendente';

    if (status === 'pendente') {
        return <button onClick={() => onPagar(leilao)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2 animate-pulse"><CreditCard size={20}/> PAGAR AGORA</button>;
    }
    if (status === 'analise' || status === 'validado') {
        return (
            <div className="w-full mt-2">
                <button disabled className="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 cursor-wait"><Hourglass size={20}/> PROCESSANDO</button>
                <div className="text-center text-[10px] text-gray-400 mt-1">Aguardando aprovação do Admin...</div>
            </div>
        );
    }
    // DINHEIRO COM A PLATAFORMA -> AGUARDANDO ENTREGA
    if (status === 'aprovado') {
        return (
            <div className="w-full mt-2 space-y-2">
                <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded-lg text-center border border-blue-100">
                    Dinheiro seguro com a Plataforma. Só confirme após receber.
                </div>
                <button onClick={() => onConfirmarEntrega(leilao.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2">
                    <ThumbsUp size={20}/> RECEBI E GOSTEI
                </button>
                <button onClick={() => onReportarProblema(leilao.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl border border-red-200 flex items-center justify-center gap-2 text-xs">
                    <ThumbsDown size={14}/> NÃO RECEBI / DEFEITO
                </button>
                {/* Botão de contato com vendedor */}
                <a href={`https://wa.me/${leilao.whatsapp}?text=Ola, paguei o item ${leilao.item}`} target="_blank" className="block text-center text-blue-500 text-xs hover:underline mt-2">Falar com Vendedor no WhatsApp</a>
            </div>
        );
    }
    if (status === 'finalizado') {
        return <div className="w-full bg-green-100 text-green-700 font-bold py-3 rounded-xl mt-2 text-center text-sm border border-green-200">NEGÓCIO CONCLUÍDO! 🎉</div>;
    }
    if (status === 'bloqueado') {
        return <div className="w-full bg-red-100 text-red-700 font-bold py-3 rounded-xl mt-2 text-center text-sm border border-red-200">EM DISPUTA/ANÁLISE 🚨</div>;
    }
    return null;
};

function App() {
  const [leiloes, setLeiloes] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  const [pagina, setPagina] = useState('home');
  const [user, setUser] = useState(null);
  
  // MODAIS E ESTADOS
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalPagamentoVencedor, setModalPagamentoVencedor] = useState(null);
  const [etapaPagamento, setEtapaPagamento] = useState(0); 
  const [metodoSelecionado, setMetodoSelecionado] = useState(null);

  // FORMULÁRIOS
  const [loginForm, setLoginForm] = useState({ nome: '', whatsapp: '', cpf: '' });
  const [novoItem, setNovoItem] = useState({ 
    titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false,
    localizacao: '', frete: 'retirada', termosAceitos: false // NOVO
  });

  const TAXA_COMISSAO = 0.05;

  useEffect(() => {
    socket.on('update_lista', (data) => setLeiloes(data));
    socket.on('notificacao', (data) => {
      if (data.tipo === 'success') toast.success(data.msg);
      else if (data.tipo === 'warning') toast.warn(data.msg);
      else if (data.tipo === 'error') toast.error(data.msg);
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
    if (!loginForm.nome) return toast.error("Preencha o nome!");
    setUser(loginForm);
    localStorage.setItem('lanceprime_user', JSON.stringify(loginForm));
    setShowLoginModal(false);
    if (loginForm.nome.toLowerCase() === 'admin') {
        toast.info("👑 Modo Administrador Ativado!");
        setPagina('admin');
    } else {
        toast.success("Login realizado!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lanceprime_user');
    setPagina('home');
  };

  const verificarAcaoRestrita = () => {
    if (!user) { setShowLoginModal(true); return false; }
    return true;
  };

  const enviarLance = (leilao, valorDigitado) => {
    if (!verificarAcaoRestrita()) return;
    const valor = Number(valorDigitado);
    const minimo = leilao.valorAtual + leilao.incrementoMinimo;
    if (valor < minimo) { toast.error(`O lance mínimo é R$ ${minimo}`); return; }
    socket.emit('dar_lance', { idLeilao: leilao.id, valor: valor, usuario: user.nome, whatsapp: user.whatsapp });
  };

  const tentarCriarLeilao = (e) => {
    e.preventDefault();
    if (!novoItem.termosAceitos) return toast.warn("Você deve aceitar os termos de garantia."); // TRAVA
    if (novoItem.destaque) setModalPagamento(true);
    else finalizarPublicacao();
  };

  const finalizarPublicacao = () => {
    socket.emit('criar_leilao', { ...novoItem, usuario: user.nome, whatsapp: user.whatsapp });
    setNovoItem({ titulo: '', descricao: '', valorInicial: '', incremento: '', minutos: 10, foto: '', destaque: false, localizacao: '', frete: 'retirada', termosAceitos: false });
    setModalPagamento(false);
    setPagina('home');
    toast.success("Anúncio publicado!");
  };

  const abrirModalPagamentoVencedor = (leilao) => {
      setEtapaPagamento(0); 
      setMetodoSelecionado(null);
      setModalPagamentoVencedor(leilao);
  };

  const confirmarPagamentoVencedor = () => {
    if (modalPagamentoVencedor && metodoSelecionado) {
        const reciboGerado = {
            id: 'REC-' + Math.floor(Math.random() * 1000000000),
            data: new Date().toLocaleString(),
            valor: modalPagamentoVencedor.valorAtual,
            comprador: user.nome,
            vendedor: modalPagamentoVencedor.dono,
            metodo: metodoSelecionado
        };
        socket.emit('gerar_recibo_pagamento', { idLeilao: modalPagamentoVencedor.id, recibo: reciboGerado });
        setModalPagamentoVencedor(null);
        toast.success(`Recibo #${reciboGerado.id} enviado!`);
    }
  };

  // --- AÇÕES SEGURAS ---
  const vendedorValidar = (id) => { socket.emit('vendedor_validar_recibo', id); toast.success("Recibo validado! Enviado para o Admin."); };
  const adminAprovar = (id) => { socket.emit('admin_aprovar_pagamento', id); toast.success("Pagamento retido com segurança!"); };
  
  // NOVAS AÇÕES DO COMPRADOR
  const confirmarEntrega = (id) => {
      if(window.confirm("Atenção: Ao confirmar, o dinheiro será liberado para o vendedor. O produto está OK?")) {
          socket.emit('comprador_confirmar_recebimento', id);
          toast.success("Obrigado! Pagamento liberado ao vendedor.");
      }
  };
  
  const reportarProblema = (id) => {
      if(window.prompt("Descreva o problema para o suporte:")) {
          socket.emit('comprador_reportar_problema', id);
          toast.error("Pagamento bloqueado. Nossa equipe entrará em contato.");
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-5 right-5 text-gray-400"><X/></button>
              <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-6">Identifique-se</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input required className="w-full p-3.5 bg-gray-50 border rounded-xl" placeholder="Nome" value={loginForm.nome} onChange={e => setLoginForm({...loginForm, nome: e.target.value})} />
                <input type="tel" className="w-full p-3.5 bg-gray-50 border rounded-xl" placeholder="WhatsApp" value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
                <input className="w-full p-3.5 bg-gray-50 border rounded-xl" placeholder="CPF" value={loginForm.cpf} onChange={e => setLoginForm({...loginForm, cpf: e.target.value})} />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">ENTRAR</button>
              </form>
           </div>
        </div>
      )}

      {modalPagamentoVencedor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative shadow-2xl">
                <button onClick={() => setModalPagamentoVencedor(null)} className="absolute top-4 right-4 text-gray-400"><X/></button>
                <h3 className="font-bold text-2xl text-gray-900 mb-1">Pagar Arremate</h3>
                <p className="text-gray-500 text-sm mb-6">Valor: {formatarMoeda(modalPagamentoVencedor.valorAtual)}</p>
                
                {etapaPagamento === 0 && (
                    <div className="space-y-3">
                        <p className="font-bold text-gray-700 mb-4">Escolha a forma de pagamento:</p>
                        <button onClick={() => {setMetodoSelecionado('PIX'); setEtapaPagamento(1)}} className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-800 font-bold py-4 rounded-xl flex items-center justify-center gap-3"><QrCode size={24}/> PAGAR COM PIX</button>
                        <button onClick={() => {setMetodoSelecionado('CARTAO'); setEtapaPagamento(1)}} className="w-full bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-800 font-bold py-4 rounded-xl flex items-center justify-center gap-3"><CreditCard size={24}/> PAGAR COM CARTÃO</button>
                    </div>
                )}

                {etapaPagamento === 1 && (
                    <div className="animate-fade-in">
                        {metodoSelecionado === 'PIX' ? <div className="bg-gray-900 p-4 rounded-2xl mb-4 inline-block"><QrCode size={160} className="text-white"/></div> : <div className="bg-gray-100 p-8 rounded-2xl mb-4 text-gray-400"><CreditCard size={64} className="mx-auto mb-2"/>Simulação de Cartão</div>}
                        <p className="text-xs text-gray-400 mb-4">Pagamento para <b>LancePrime (Custódia)</b>.</p>
                        <button onClick={confirmarPagamentoVencedor} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg">CONFIRMAR E GERAR RECIBO</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xl tracking-tight cursor-pointer" onClick={() => setPagina('home')}>
            <Gavel className="text-blue-600" size={24} /> 
            <span className="hidden md:inline">LANCE<span className="text-blue-600">PRIME</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 bg-gray-50 pl-1.5 pr-3 py-1 rounded-full border border-gray-200">
                    <div className="bg-white p-1 rounded-full text-blue-600 shadow-sm"><User size={14} /></div>
                    <span className="font-semibold text-xs text-gray-700 max-w-[80px] truncate">{user.nome}</span>
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
        
        {pagina === 'home' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Award className="text-blue-600"/> Leilões Ativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leiloes.map((leilao) => (
                  <CardLeilao key={leilao.id} leilao={leilao} user={user} agora={agora} onLance={enviarLance} onPagar={abrirModalPagamentoVencedor} onConfirmarEntrega={confirmarEntrega} onReportarProblema={reportarProblema}/>
              ))}
            </div>
          </div>
        )}

        {pagina === 'admin' && user && user.nome.toLowerCase() === 'admin' && (
             <div className="max-w-4xl mx-auto space-y-8">
                 <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-red-100">
                    <h2 className="text-2xl font-bold mb-8 text-red-800 border-b pb-4 flex items-center gap-2"><Lock size={24}/> Área Administrativa</h2>
                    <div className="space-y-4">
                        {leiloes.filter(l => l.statusPagamento === 'validado').length === 0 && leiloes.filter(l => l.statusPagamento === 'bloqueado').length === 0 ? <p className="text-gray-400">Nenhuma pendência.</p> : null}
                        
                        {/* ITENS VALIDADOS */}
                        {leiloes.filter(l => l.statusPagamento === 'validado').map(l => (
                            <div key={l.id} className="bg-red-50 border border-red-200 p-5 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div><h4 className="font-bold text-red-900 text-lg">{l.item}</h4><p className="text-sm text-red-700">Comprador: <b>{l.lances[0].usuario}</b></p></div>
                                    <div className="text-right"><div className="font-bold text-xl text-red-900">{formatarMoeda(l.valorAtual)}</div><div className="text-xs text-red-400 font-bold uppercase">Aguardando Aprovação</div></div>
                                </div>
                                <button onClick={() => adminAprovar(l.id)} className="w-full bg-green-600 text-white font-bold px-6 py-3 rounded-xl shadow hover:bg-green-700 flex items-center justify-center gap-2"><CheckCircle size={20}/> DINHEIRO NA CONTA (LIBERAR ENTREGA)</button>
                            </div>
                        ))}

                        {/* ITENS COM PROBLEMA (BLOQUEADOS) */}
                        {leiloes.filter(l => l.statusPagamento === 'bloqueado').map(l => (
                            <div key={l.id} className="bg-orange-50 border border-orange-200 p-5 rounded-2xl">
                                <h4 className="font-bold text-orange-900 text-lg flex items-center gap-2"><AlertTriangle/> DISPUTA ABERTA: {l.item}</h4>
                                <p className="text-sm text-orange-700 mb-4">O comprador relatou um problema. Entre em contato com ambas as partes.</p>
                                <div className="flex gap-2">
                                    <a href={`https://wa.me/${l.whatsapp}`} target="_blank" className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">ZAP VENDEDOR</a>
                                    <button className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold">CANCELAR VENDA</button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
        )}

        {pagina === 'criar' && (
          <div className="max-w-2xl mx-auto">
             {!verificarAcaoRestrita() ? <div className="text-center py-20 bg-white rounded-3xl"><p>Aguardando login...</p></div> : 
                 <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6"><div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200"><PlusCircle size={28} /></div><div><h2 className="text-2xl font-bold text-gray-900">Novo Leilão</h2></div></div>
                    <form onSubmit={tentarCriarLeilao} className="space-y-6">
                        <div className="space-y-4">
                            <input required className="w-full pl-4 p-4 bg-gray-50 border rounded-xl" value={novoItem.titulo} onChange={e => setNovoItem({...novoItem, titulo: e.target.value})} placeholder="Título do Anúncio" />
                            <textarea required className="w-full pl-4 p-4 bg-gray-50 border rounded-xl" value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} placeholder="Descrição" />
                            <input required type="url" className="w-full pl-4 p-4 bg-gray-50 border rounded-xl" value={novoItem.foto} onChange={e => setNovoItem({...novoItem, foto: e.target.value})} placeholder="URL Imagem" />
                        </div>
                        <div className="grid grid-cols-2 gap-4"><input required type="number" className="w-full p-4 bg-gray-50 border rounded-xl" value={novoItem.valorInicial} onChange={e => setNovoItem({...novoItem, valorInicial: e.target.value})} placeholder="Valor Inicial" /><input required type="number" className="w-full p-4 bg-gray-50 border rounded-xl" value={novoItem.incremento} onChange={e => setNovoItem({...novoItem, incremento: e.target.value})} placeholder="Incremento" /></div>
                        <div className="grid grid-cols-2 gap-4"><input required type="number" className="w-full p-4 bg-gray-50 border rounded-xl" value={novoItem.minutos} onChange={e => setNovoItem({...novoItem, minutos: e.target.value})} placeholder="Tempo (min)" /><input required className="w-full p-4 bg-gray-50 border rounded-xl" value={novoItem.localizacao} onChange={e => setNovoItem({...novoItem, localizacao: e.target.value})} placeholder="Cidade/UF" /></div>
                        
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <input type="checkbox" id="termos" className="w-5 h-5" checked={novoItem.termosAceitos} onChange={e => setNovoItem({...novoItem, termosAceitos: e.target.checked})} />
                            <label htmlFor="termos" className="text-xs text-blue-900 cursor-pointer">Estou ciente que o pagamento ficará retido na plataforma até o comprador confirmar o recebimento do produto sem defeitos.</label>
                        </div>

                        <button type="submit" className="w-full font-bold py-5 rounded-xl text-lg shadow-xl bg-green-600 hover:bg-green-700 text-white">PUBLICAR ANÚNCIO</button>
                    </form>
                 </div>
             }
          </div>
        )}

        {pagina === 'perfil' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
               <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">Financeiro</h2>
               <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign size={20} className="text-blue-500"/> Minhas Vendas</h3>
               <div className="grid gap-4 mb-10">
                   {leiloes.filter(l => l.dono === user.nome).map(l => (
                       <div key={l.id} className="bg-white border border-gray-100 p-5 rounded-2xl">
                           <div className="flex justify-between items-start mb-4">
                               <div><div className="font-bold text-gray-900 text-lg">{l.item}</div><div className="text-sm text-gray-500 mt-1">Status: <b className="uppercase text-blue-600">{l.statusPagamento || 'Pendente'}</b></div></div>
                               <div className="text-right"><div className="font-bold text-blue-900 text-xl">{formatarMoeda(l.valorAtual)}</div></div>
                           </div>
                           {l.statusPagamento === 'analise' && l.dadosRecibo && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 mb-4 shadow-sm font-mono">
                                    <div className="flex items-center gap-2 font-bold mb-2 border-b border-blue-200 pb-2"><Receipt size={16}/> PAGAMENTO RECEBIDO NO SITE</div>
                                    <p><b>ID:</b> {l.dadosRecibo.id} | <b>Valor:</b> {formatarMoeda(l.dadosRecibo.valor)}</p>
                                    <div className="mt-3"><button onClick={() => vendedorValidar(l.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm animate-pulse"><CheckCircle size={14}/> VALIDAR RECIBO P/ ADMIN</button></div>
                                </div>
                           )}
                       </div>
                    ))}
               </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-6 py-3 z-30 flex justify-around shadow-[0_-5px_15px_rgba(0,0,0,0.05)] safe-area-bottom">
          <NavBtn icon={Home} label="Início" active={pagina==='home'} onClick={()=>setPagina('home')}/>
          <div className="relative -top-8"><button onClick={()=> user ? setPagina('criar') : setShowLoginModal(true)} className="bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-300 hover:scale-110 transition-transform"><PlusCircle size={32}/></button></div>
          <NavBtn icon={LayoutDashboard} label="Painel" active={pagina==='perfil'} onClick={()=> user ? setPagina('perfil') : setShowLoginModal(true)}/>
          {user && user.nome.toLowerCase() === 'admin' && <NavBtn icon={Lock} label="Admin" active={pagina==='admin'} onClick={()=>setPagina('admin')}/>}
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
