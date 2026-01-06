import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Gavel, Clock, User, ShieldCheck, History } from 'lucide-react';

// Ajuste para a URL do seu backend no Render depois
const socket = io('http://localhost:3001');

function App() {
  const [leilao, setLeilao] = useState(null);
  const [tempo, setTempo] = useState("");
  const [usuario, setUsuario] = useState("Visitante_" + Math.floor(Math.random() * 100));

  useEffect(() => {
    socket.on('update_auction', (data) => setLeilao(data));
    
    const interval = setInterval(() => {
      if (leilao) {
        const diff = leilao.termino - Date.now();
        if (diff <= 0) {
          setTempo("ENCERRADO");
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTempo(`${m}m ${s}s`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [leilao]);

  const enviarLance = () => {
    const valorLance = leilao.valorAtual + leilao.incrementoMinimo;
    socket.emit('dar_lance', { valor: valorLance, usuario: usuario });
  };

  if (!leilao) return <div className="flex justify-center items-center h-screen">Carregando Leilão...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Gavel size={32} /> <span>BID-AUCTION</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <User size={20} /> <span className="font-medium">{usuario}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Produto e Fotos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-2 rounded-2xl shadow-md">
            <img src={leilao.fotos[0]} alt="Produto" className="w-full h-96 object-cover rounded-xl" />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h1 className="text-3xl font-black mb-2">{leilao.item}</h1>
            <p className="text-gray-600 leading-relaxed">{leilao.descricao}</p>
            <div className="mt-4 flex gap-4">
              <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                <ShieldCheck size={14} /> DOCUMENTAÇÃO OK
              </span>
              <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                LOTE ATIVO
              </span>
            </div>
          </div>
        </div>

        {/* Painel de Lances */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-slate-400"><Clock size={20}/> Tempo</div>
              <div className="text-2xl font-mono font-bold text-yellow-400">{tempo}</div>
            </div>

            <div className="mb-8">
              <span className="text-slate-400 text-sm uppercase tracking-wider">Lance Atual</span>
              <div className="text-5xl font-black text-white">R$ {leilao.valorAtual.toLocaleString()}</div>
            </div>

            <button 
              onClick={enviarLance}
              disabled={tempo === "ENCERRADO"}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              {tempo === "ENCERRADO" ? "LEILÃO ENCERRADO" : `DAR LANCE R$ ${(leilao.valorAtual + leilao.incrementoMinimo).toLocaleString()}`}
            </button>
          </div>

          {/* Histórico */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex items-center gap-2 font-bold mb-4 border-b pb-2">
              <History size={18} /> Últimos Lances
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {leilao.lances.map((l, i) => (
                <div key={i} className={`flex justify-between p-3 rounded-lg ${i === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                  <div>
                    <div className="text-sm font-bold">{l.usuario}</div>
                    <div className="text-[10px] text-gray-400 uppercase">{l.data}</div>
                  </div>
                  <div className="font-black text-blue-600 text-right">R$ {l.valor.toLocaleString()}</div>
                </div>
              ))}
              {leilao.lances.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Nenhum lance ainda. Seja o primeiro!</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
