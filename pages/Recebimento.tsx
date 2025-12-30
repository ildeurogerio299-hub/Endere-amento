
import React, { useState, useEffect } from 'react';
import { Recebimento, DetalheRecebimento, Produto, Embalagem } from '../types';
import CRUDButtons from '../components/CRUDButtons';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Loader2, FileText, Calendar, User, PackageSearch } from 'lucide-react';

const RecebimentoPage: React.FC = () => {
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data States
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [embalagens, setEmbalagens] = useState<Embalagem[]>([]);

  // Form States
  const [header, setHeader] = useState<Partial<Recebimento>>({
    numero_nf: '',
    data_recebimento: new Date().toISOString().split('T')[0],
    fornecedor: '',
    status: 'Pendente'
  });
  const [itens, setItens] = useState<Partial<DetalheRecebimento>[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setFetching(true);
    try {
      const [resNF, resProd, resEmb] = await Promise.all([
        supabase.from('recebimentos').select('*').order('data_recebimento', { ascending: false }),
        supabase.from('produtos').select('*').order('nome'),
        supabase.from('embalagens').select('*').order('nome')
      ]);

      if (resNF.error) throw resNF.error;
      setRecebimentos(resNF.data || []);
      setProdutos(resProd.data || []);
      setEmbalagens(resEmb.data || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados de recebimento.');
    } finally {
      setFetching(false);
    }
  };

  const loadDetails = async (recebimentoId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('detalhe_recebimento')
        .select('*')
        .eq('recebimento_id', recebimentoId);
      
      if (error) throw error;
      setItens(data || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar itens da nota.');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setHeader({
      numero_nf: '',
      data_recebimento: new Date().toISOString().split('T')[0],
      fornecedor: '',
      status: 'Pendente'
    });
    setItens([]);
    setMode('new');
  };

  const handleEdit = async (nf: Recebimento) => {
    setHeader(nf);
    await loadDetails(nf.id);
    setMode('edit');
  };

  const handleSave = async () => {
    if (!header.numero_nf || !header.fornecedor || itens.length === 0) {
      alert("Preencha o cabeçalho e adicione pelo menos um item!");
      return;
    }

    setLoading(true);
    try {
      let recebimentoId = header.id;

      // 1. Salvar Cabeçalho
      if (mode === 'new') {
        const { data, error } = await supabase
          .from('recebimentos')
          .insert([{
            numero_nf: header.numero_nf,
            data_recebimento: header.data_recebimento,
            fornecedor: header.fornecedor,
            status: header.status
          }])
          .select()
          .single();
        if (error) throw error;
        recebimentoId = data.id;
      } else {
        const { error } = await supabase
          .from('recebimentos')
          .update({
            numero_nf: header.numero_nf,
            data_recebimento: header.data_recebimento,
            fornecedor: header.fornecedor,
            status: header.status
          })
          .eq('id', header.id);
        if (error) throw error;

        // Se estiver editando, removemos os itens antigos para reinserir (estratégia simples)
        const { error: delError } = await supabase
          .from('detalhe_recebimento')
          .delete()
          .eq('recebimento_id', recebimentoId);
        if (delError) throw delError;
      }

      // 2. Salvar Itens
      const payloadItens = itens.map(item => ({
        recebimento_id: recebimentoId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        embalagem_id: item.embalagem_id,
        valor_unitario: item.valor_unitario
      }));

      const { error: itemsError } = await supabase
        .from('detalhe_recebimento')
        .insert(payloadItens);
      
      if (itemsError) throw itemsError;

      alert('Recebimento processado com sucesso!');
      setMode('view');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar recebimento. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItens([...itens, { 
      id: 'temp-' + Date.now(), 
      produto_id: '', 
      quantidade: 1, 
      embalagem_id: embalagens[0]?.id || '', 
      valor_unitario: 0 
    }]);
  };

  const removeItem = (id: string) => {
    setItens(itens.filter(i => i.id !== id));
  };

  const updateItem = (tempId: string, field: keyof DetalheRecebimento, value: any) => {
    setItens(itens.map(i => i.id === tempId ? { ...i, [field]: value } : i));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <CRUDButtons 
        mode={mode}
        onNew={handleNew}
        onSave={handleSave}
        onEdit={() => mode === 'view' && alert('Selecione uma NF na lista abaixo')}
        onCancel={() => confirm("Deseja cancelar a edição?") && setMode('view')}
        onDiscard={() => confirm("Descartar nota fiscal?") && setMode('view')}
        loading={loading}
      />

      {mode !== 'view' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header Form */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
            <h3 className="text-sm font-bold mb-6 text-indigo-900 border-b pb-2 uppercase tracking-widest flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Identificação da Nota Fiscal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número NF *</label>
                <input 
                  type="text" 
                  disabled={loading}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  placeholder="Ex: 001234"
                  value={header.numero_nf}
                  onChange={e => setHeader({...header, numero_nf: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fornecedor *</label>
                <input 
                  type="text" 
                  disabled={loading}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  placeholder="Nome do Fornecedor"
                  value={header.fornecedor}
                  onChange={e => setHeader({...header, fornecedor: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Recebimento</label>
                <input 
                  type="date" 
                  disabled={loading}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={header.data_recebimento}
                  onChange={e => setHeader({...header, data_recebimento: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center">
                <PackageSearch className="w-4 h-4 mr-2" /> Itens e Produtos
              </h3>
              <button 
                onClick={addItem}
                disabled={loading}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center hover:bg-indigo-100 transition border border-indigo-200 shadow-sm"
              >
                <Plus className="w-3 h-3 mr-1" /> ADICIONAR PRODUTO
              </button>
            </div>

            <div className="overflow-x-auto border rounded-xl bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-black tracking-tighter">
                  <tr>
                    <th className="p-4 border-b">Produto</th>
                    <th className="p-4 border-b text-center w-24">Qtd</th>
                    <th className="p-4 border-b w-40">Embalagem</th>
                    <th className="p-4 border-b w-32">Vlr Unitário</th>
                    <th className="p-4 border-b text-center w-16">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itens.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                      <td className="p-2">
                        <select 
                          disabled={loading}
                          className="w-full p-2 text-sm border-none bg-transparent focus:ring-0 font-medium"
                          value={item.produto_id}
                          onChange={e => updateItem(item.id!, 'produto_id', e.target.value)}
                        >
                          <option value="">Selecione um Produto...</option>
                          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.codigo})</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          disabled={loading}
                          className="w-full p-2 text-sm border-none bg-transparent focus:ring-0 text-center font-bold"
                          value={item.quantidade}
                          onChange={e => updateItem(item.id!, 'quantidade', Number(e.target.value))}
                        />
                      </td>
                      <td className="p-2">
                        <select 
                          disabled={loading}
                          className="w-full p-2 text-sm border-none bg-transparent focus:ring-0"
                          value={item.embalagem_id}
                          onChange={e => updateItem(item.id!, 'embalagem_id', e.target.value)}
                        >
                          <option value="">...</option>
                          {embalagens.map(emb => <option key={emb.id} value={emb.id}>{emb.nome}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          disabled={loading}
                          className="w-full p-2 text-sm border-none bg-transparent focus:ring-0 text-right"
                          placeholder="0.00"
                          value={item.valor_unitario}
                          onChange={e => updateItem(item.id!, 'valor_unitario', Number(e.target.value))}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeItem(item.id!)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {itens.length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm italic">
                  Nenhum item adicionado à nota. Clique em "Adicionar Produto" para começar.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Histórico de Recebimentos</h3>
            <span className="text-xs text-gray-500 font-medium italic">Mostrando últimos recebimentos</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fetching ? (
              <div className="col-span-full p-20 text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                <p className="font-medium">Carregando Notas Fiscais...</p>
              </div>
            ) : recebimentos.length > 0 ? (
              recebimentos.map(r => (
                <div key={r.id} className="group p-6 border rounded-2xl shadow-sm bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                    <FileText className="w-12 h-12 text-indigo-900" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Nota Fiscal</span>
                      <h4 className="text-xl font-black text-gray-800 tracking-tighter">#{r.numero_nf}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      r.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 relative z-10">
                    <div className="flex items-center text-gray-700">
                      <User className="w-3.5 h-3.5 mr-2 text-gray-400" />
                      <p className="text-sm font-bold truncate">{r.fornecedor}</p>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                      <p className="text-xs font-medium">{new Date(r.data_recebimento).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleEdit(r)}
                    className="w-full py-2.5 bg-gray-50 text-indigo-600 rounded-xl text-xs font-black border border-gray-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 uppercase tracking-widest shadow-sm"
                  >
                    VER / EDITAR DETALHES
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 border-2 border-dashed rounded-2xl text-center text-gray-400">
                Nenhum recebimento registrado no sistema.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecebimentoPage;
