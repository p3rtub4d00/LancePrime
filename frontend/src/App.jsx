import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, ShieldCheck, History } from 'lucide-react';

// URL DO SEU BACKEND NO RENDER (JÁ ATUALIZADA)
const socket = io('https://duckhuntbet.onrender.com');

function App() {
  const [leilao, setLeilao] = useState(null);
  const [tempo, setTempo] = useState("");
  // Gera um nome de usuário aleatório para teste se não houver login
  const [usuario] = useState("Visitante_" + Math.floor(Math.random() * 1000));

  useEffect(() => {
    // Escuta atualizações do leilão vindas do servidor
    socket.on('update_auction', (data) => {
      console.log("Dados recebidos:", data);
      setLeilao(data);
    });
    
    // Timer local apenas para atualizar a tela a cada segundo
    const interval = setInterval(() => {
      if (leilao) {
        const diff = leilao.termino - Date.now();
        if (diff <= 0) {
          setTempo("ENCERRADO");
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          // Adiciona um zero à esquerda se os segundos forem menores que 10
          setTempo(`${m}m ${s < 10 ? '0' + s : s}s`);
        }
      }
    }, 1000);

    return () => {
      socket.off('update_auction');
      clearInterval(interval);
    };
  }, [leilao]);

  const enviarLance = () => {
    if (!leilao) return;
    const valorLance = leilao.valorAtual + leilao.incrementoMinimo;
    socket.emit('dar_lance', { valor: valorLance, usuario: usuario });
  };

  if (!leilao) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Conectando ao Leilão...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-blue-700 font-black text-2xl tracking-tighter mb-4 md:mb-0">
            <Gavel size={32} /> <span>LANCE<span className="text-yellow-500">PRIME</span></span>
          </div>
          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
            <div className="bg-blue-600 text-white p-1 rounded-full">
              <User size={16} />
            </div>
            <span className="font-bold text-sm text-gray-700">{usuario}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda: Produto */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {leilao.fotos && leilao.fotos.length > 0 ? (
                <img src={leilao.fotos[0]} alt="Produto" className="w-full h-auto object-cover rounded-xl transition-transform hover:scale-105 duration-500" />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">Sem Imagem</div>
              )}
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h1 className="text-3xl md:text-4xl font-black mb-4 text-gray-800">{leilao.item}</h1>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">{leilao.descricao}</p>
              
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-2 text-xs font-bold bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                  <ShieldCheck size={16} /> VERIFICADO PELA EQUIPE
                </span>
                <span className="flex items-center gap-2 text-xs font-bold bg-blue-100 text-blue-800 px-4 py-2 rounded-lg border border-blue-200">
                  ENTREGA IMEDIATA
                </span>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Painel de Controle */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
              {/* Efeito de fundo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

              <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">
                    <Clock size={16}/> Encerra em
                  </div>
                  <div className={`text-4xl font-mono font-bold ${tempo === "ENCERRADO" ? "text-red-500" : "text-yellow-400"}`}>
                    {tempo}
                  </div>
                </div>
              </div>

              <div className="mb-8 relative z-10">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Lance Atual</span>
                <div className="text-5xl md:text-6xl font-black text-white mt-2">
                  R$ {leilao.valorAtual.toLocaleString('pt-BR')}
                </div>
              </div>

              <button 
                onClick={enviarLance}
                disabled={tempo === "ENCERRADO"}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl transition-all shadow-lg active:scale-95 text-lg relative z-10 border-b-4 border-blue-800 hover:border-blue-700 disabled:border-transparent"
              >
                {tempo === "ENCERRADO" 
                  ? "LEILÃO FINALIZADO" 
                  : `DAR LANCE R$ ${(leilao.valorAtual + leilao.incrementoMinimo).toLocaleString('pt-BR')}`
                }
              </button>
              
              <p className="text-center text-slate-500 text-xs mt-4">
                + Incremento mínimo de R$ {leilao.incrementoMinimo.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Histórico de Lances */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 font-bold mb-6 text-gray-800 border-b border-gray-100 pb-4">
                <History size={20} className="text-blue-600" /> Histórico de Lances em Tempo Real
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
                {leilao.lances.map((l, i) => (
                  <div key={i} className={`flex justify-between items-center p-4 rounded-xl transition-colors ${i === 0 ? 'bg-blue-50 border border-blue-100 shadow-sm' : 'bg-white hover:bg-gray-50 border border-transparent'}`}>
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${i === 0 ? 'text-blue-900' : 'text-gray-700'}`}>
                        {l.usuario} {i === 0 && <span className="ml-2 text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">LÍDER</span>}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono mt-1">{l.data}</span>
                    </div>
                    <div className={`font-black text-lg ${i === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      R$ {l.valor.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
                {leilao.lances.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 font-medium">Nenhum lance ainda.</p>
                    <p className="text-sm text-blue-500 font-bold mt-1">Seja o primeiro a dar um lance!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
