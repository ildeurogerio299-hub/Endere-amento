
import React, { useState, useEffect } from 'react';
import { Filter, Download, Printer, Loader2, Package, Truck, Search, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Produto, Galpao } from '../types';

const Relatorios: React.FC = () => {
  const [reportType, setReportType] = useState<'estoque' | 'recebimento'>('estoque');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  
  // Filtros
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [galpoes, setGalpoes] = useState<Galpao[]>([]);
  const [filterProd, setFilterProd] = useState('');
  const [filterGalp, setFilterGalp] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    fetchSupportData();
    applyFilters();
  }, [reportType]);

  const fetchSupportData = async () => {
    const { data: p } = await supabase.from('produtos').select('*').order('nome');
    const { data: g } = await supabase.from('galpoes').select('*').order('nome');
    setProdutos(p || []);
    setGalpoes(g || []);
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      if (reportType === 'estoque') {
        let query = supabase.from('enderecamento').select(`
          *,
          produtos(nome, codigo),
          galpoes(nome),
          corredores(nome),
          caixas(nome),
          status_estoque(descricao, cor_hexa)
        `);

        if (filterProd) query = query.eq('produto_id', filterProd);
        if (filterGalp) query = query.eq('galpao_id', filterGalp);
        if (dateStart) query = query.gte('data_cadastro', `${dateStart}T00:00:00`);
        if (dateEnd) query = query.lte('data_cadastro', `${dateEnd}T23:59:59`);

        const { data: res } = await query.order('data_cadastro', { ascending: false });
        setData(res || []);
      } else {
        let query = supabase.from('recebimentos').select('*');
        
        if (dateStart) query = query.gte('data_recebimento', dateStart);
        if (dateEnd) query = query.lte('data_recebimento', dateEnd);

        const { data: res } = await query.order('data_recebimento', { ascending: false });
        setData(res || []);
      }
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'estoque') {
      csvContent += "Produto,Codigo,Galpao,Caixa,Quantidade,Status,Data\n";
      data.forEach(item => {
        csvContent += `"${item.produtos?.nome}","${item.produtos?.codigo}","${item.galpoes?.nome}","${item.caixas?.nome}","${item.quantidade}","${item.status_estoque?.descricao}","${new Date(item.data_cadastro).toLocaleDateString()}"\n`;
      });
    } else {
      csvContent += "Data,NF,Fornecedor,Status\n";
      data.forEach(item => {
        csvContent += `"${new Date(item.data_recebimento).toLocaleDateString()}","${item.numero_nf}","${item.fornecedor}","${item.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center p-1 bg-gray-100 rounded-xl space-x-1">
            <button 
              onClick={() => setReportType('estoque')}
              className={`flex items-center px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${reportType === 'estoque' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Package className="w-3.5 h-3.5 mr-2" /> Posição de Estoque
            </button>
            <button 
              onClick={() => setReportType('recebimento')}
              className={`flex items-center px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${reportType === 'recebimento' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Truck className="w-3.5 h-3.5 mr-2" /> Histórico NFs
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handlePrint} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg border bg-white transition shadow-sm" title="Imprimir Relatório"><Printer className="w-4 h-4" /></button>
            <button onClick={handleExport} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg border bg-white transition shadow-sm" title="Exportar para CSV"><Download className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 mb-8 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Filtrar Produto</label>
              <select 
                className="w-full p-2.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterProd}
                onChange={e => setFilterProd(e.target.value)}
              >
                <option value="">Todos os Produtos</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Filtrar Galpão</label>
              <select 
                className="w-full p-2.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterGalp}
                onChange={e => setFilterGalp(e.target.value)}
              >
                <option value="">Todos os Galpões</option>
                {galpoes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Período</label>
              <div className="flex items-center space-x-2">
                <input type="date" className="w-full p-2 text-sm border rounded-lg bg-white" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                <span className="text-gray-300 font-bold">/</span>
                <input type="date" className="w-full p-2 text-sm border rounded-lg bg-white" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
              </div>
            </div>
            <button 
              onClick={applyFilters}
              disabled={loading}
              className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
              Gerar Relatório
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none">
        <div className="hidden print:block mb-8 text-center border-b pb-4">
           <h1 className="text-2xl font-black text-indigo-900 uppercase">Sistema de Endereçamento</h1>
           <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Relatório: {reportType === 'estoque' ? 'Posição de Estoque' : 'Histórico de Recebimentos'}</p>
           <p className="text-[10px] text-gray-400">Gerado em: {new Date().toLocaleString()}</p>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'estoque' ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-400 font-black uppercase text-[10px] tracking-widest bg-gray-50/50">
                  <th className="p-4">Descrição do Produto</th>
                  <th className="p-4">Código</th>
                  <th className="p-4"><div className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> Endereço</div></th>
                  <th className="p-4 text-center">Saldo</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.length > 0 ? data.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                     <td className="p-4 font-bold text-gray-800">{item.produtos?.nome}</td>
                     <td className="p-4 text-indigo-600 font-black text-[10px]">#{item.produtos?.codigo}</td>
                     <td className="p-4">
                        <div className="flex items-center text-[10px] font-black uppercase space-x-1">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded" title="Galpão">{item.galpoes?.nome}</span>
                          <span className="text-gray-300">/</span>
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded" title="Caixa">{item.caixas?.nome}</span>
                        </div>
                     </td>
                     <td className="p-4 text-center font-black text-gray-700">{item.quantidade} UN</td>
                     <td className="p-4">
                       <span className="px-2 py-1 text-[10px] font-black rounded-lg border uppercase tracking-tighter" style={{
                         borderColor: item.status_estoque?.cor_hexa,
                         color: item.status_estoque?.cor_hexa,
                         backgroundColor: `${item.status_estoque?.cor_hexa}10`
                       }}>
                        {item.status_estoque?.descricao}
                       </span>
                     </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">Nenhum dado encontrado para os filtros aplicados.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-400 font-black uppercase text-[10px] tracking-widest bg-gray-50/50">
                  <th className="p-4">Data</th>
                  <th className="p-4">NF #</th>
                  <th className="p-4">Fornecedor</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.length > 0 ? data.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                     <td className="p-4 font-medium text-gray-600">{new Date(item.data_recebimento).toLocaleDateString()}</td>
                     <td className="p-4 text-indigo-600 font-black tracking-tighter">NF-{item.numero_nf}</td>
                     <td className="p-4 font-bold text-gray-800">{item.fornecedor}</td>
                     <td className="p-4">
                       <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${item.status === 'Processado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                       </span>
                     </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">Nenhum histórico de recebimento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          #root > div > aside { display: none !important; }
          #root > div > main { margin-left: 0 !important; padding: 0 !important; }
          header { display: none !important; }
          .bg-white { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Relatorios;
