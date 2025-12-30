
import React, { useState, useEffect } from 'react';
import { Enderecamento, Galpao, Corredor, Caixa, Produto, StatusEstoque, Colaborador } from '../types';
import CRUDButtons from '../components/CRUDButtons';
import { supabase } from '../lib/supabase';
import { MapPin, Info, Loader2, Package, Hash, UserCheck, AlertCircle } from 'lucide-react';

const EnderecamentoPage: React.FC = () => {
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data States
  const [enderecamentos, setEnderecamentos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [statusList, setStatusList] = useState<StatusEstoque[]>([]);
  const [galpoes, setGalpoes] = useState<Galpao[]>([]);
  const [corredores, setCorredores] = useState<Corredor[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<Enderecamento>>({
    produto_id: '',
    galpao_id: '',
    corredor_id: '',
    caixa_id: '',
    quantidade: 0,
    status_estoque_id: '',
    cadastrado_por: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setFetching(true);
    try {
      // Carrega dados para a listagem (com JOINS para exibir nomes)
      const { data: listData, error: listError } = await supabase
        .from('enderecamento')
        .select(`
          *,
          produtos(nome, codigo),
          galpoes(nome),
          corredores(nome),
          caixas(nome),
          status_estoque(descricao, cor_hexa),
          colaboradores(nome)
        `)
        .order('data_cadastro', { ascending: false });

      if (listError) throw listError;
      setEnderecamentos(listData || []);

      // Carrega dados para os combos
      const [resProd, resStatus, resGalp, resCorr, resCaix, resColab] = await Promise.all([
        supabase.from('produtos').select('*').order('nome'),
        supabase.from('status_estoque').select('*').order('descricao'),
        supabase.from('galpoes').select('*').order('nome'),
        supabase.from('corredores').select('*').order('nome'),
        supabase.from('caixas').select('*').order('nome'),
        supabase.from('colaboradores').select('*').order('nome')
      ]);

      setProdutos(resProd.data || []);
      setStatusList(resStatus.data || []);
      setGalpoes(resGalp.data || []);
      setCorredores(resCorr.data || []);
      setCaixas(resCaix.data || []);
      setColaboradores(resColab.data || []);

    } catch (err) {
      console.error('Erro FASE 4:', err);
      alert('Erro ao carregar estrutura de endereçamento.');
    } finally {
      setFetching(false);
    }
  };

  // Cascade Filtering
  const filteredCorredores = corredores.filter(c => c.galpao_id === formData.galpao_id);
  const filteredCaixas = caixas.filter(cx => cx.corredor_id === formData.corredor_id);

  const selectedProduct = produtos.find(p => p.id === formData.produto_id);

  const handleNew = () => {
    setFormData({
      produto_id: '',
      galpao_id: '',
      corredor_id: '',
      caixa_id: '',
      quantidade: 0,
      status_estoque_id: statusList[0]?.id || '',
      cadastrado_por: colaboradores[0]?.id || '',
      data_cadastro: new Date().toISOString()
    });
    setMode('new');
  };

  const handleSave = async () => {
    if (!formData.produto_id || !formData.caixa_id || formData.quantidade! <= 0) {
      alert("Preencha todos os campos obrigatórios e uma quantidade válida!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        produto_id: formData.produto_id,
        galpao_id: formData.galpao_id,
        corredor_id: formData.corredor_id,
        caixa_id: formData.caixa_id,
        quantidade: formData.quantidade,
        status_estoque_id: formData.status_estoque_id,
        cadastrado_por: formData.cadastrado_por,
        data_cadastro: new Date().toISOString()
      };

      let error;
      if (mode === 'new') {
        const { error: err } = await supabase.from('enderecamento').insert([payload]);
        error = err;
      } else {
        const { error: err } = await supabase.from('enderecamento').update(payload).eq('id', formData.id);
        error = err;
      }

      if (error) throw error;
      alert('Endereçamento registrado com sucesso!');
      setMode('view');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar endereçamento no banco.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setMode('edit');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <CRUDButtons 
        mode={mode}
        onNew={handleNew}
        onSave={handleSave}
        onEdit={() => mode === 'view' && alert('Selecione um item na lista abaixo')}
        onCancel={() => confirm("Cancelar endereçamento?") && setMode('view')}
        onDiscard={() => confirm("Tem certeza que deseja descartar este endereçamento?") && setMode('view')}
        loading={loading}
      />

      {mode !== 'view' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start">
             <Info className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
             <div className="text-sm text-indigo-900">
               <p className="font-bold">Diretriz de Operação:</p>
               <p>Selecione o produto e defina sua posição exata nos galpões. A quantidade deve respeitar o saldo recebido na NF.</p>
             </div>
          </div>

          {/* Seção Produto */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Package className="w-4 h-4 mr-2" /> Item de Estoque
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Produto *</label>
                <select 
                  disabled={loading}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  value={formData.produto_id}
                  onChange={e => setFormData({...formData, produto_id: e.target.value})}
                >
                  <option value="">Selecione o Produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {selectedProduct && (
                  <div className="flex items-center mt-2 text-[10px] font-bold text-indigo-600 uppercase">
                    <Hash className="w-3 h-3 mr-1" /> Código: {selectedProduct.codigo} | UM: {selectedProduct.unidade_medida}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade *</label>
                <input 
                  type="number" 
                  disabled={loading}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
                  value={formData.quantidade}
                  onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status de Estoque</label>
                <select 
                  disabled={loading}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={formData.status_estoque_id}
                  onChange={e => setFormData({...formData, status_estoque_id: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {statusList.map(s => <option key={s.id} value={s.id}>{s.descricao}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Seção Localização */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2" /> Endereço Físico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Galpão *</label>
                <select 
                  disabled={loading}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={formData.galpao_id}
                  onChange={e => setFormData({...formData, galpao_id: e.target.value, corredor_id: '', caixa_id: ''})}
                >
                  <option value="">Escolha um Galpão...</option>
                  {galpoes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Corredor *</label>
                <select 
                  disabled={loading || !formData.galpao_id}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.corredor_id}
                  onChange={e => setFormData({...formData, corredor_id: e.target.value, caixa_id: ''})}
                >
                  <option value="">Escolha um Corredor...</option>
                  {filteredCorredores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Caixa / Posição *</label>
                <select 
                  disabled={loading || !formData.corredor_id}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.caixa_id}
                  onChange={e => setFormData({...formData, caixa_id: e.target.value})}
                >
                  <option value="">Escolha a Posição...</option>
                  {filteredCaixas.map(cx => <option key={cx.id} value={cx.id}>{cx.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-dashed border-gray-300 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
              Responsável pelo Registro:
              <select 
                className="ml-2 border-none bg-transparent focus:ring-0 font-bold text-indigo-700 underline"
                value={formData.cadastrado_por}
                onChange={e => setFormData({...formData, cadastrado_por: e.target.value})}
              >
                {colaboradores.map(colab => <option key={colab.id} value={colab.id}>{colab.nome}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 tracking-tight">Posições Físicas em Estoque</h3>
            <div className="text-xs text-gray-400 font-medium flex items-center">
               <AlertCircle className="w-3 h-3 mr-1" /> Lista atualizada via Supabase em tempo real
            </div>
          </div>
          
          <div className="overflow-hidden border rounded-2xl shadow-sm bg-white">
             <table className="w-full text-left">
               <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b">
                 <tr>
                   <th className="p-4">Produto / Código</th>
                   <th className="p-4">Localização Detalhada</th>
                   <th className="p-4 text-center">Quantidade</th>
                   <th className="p-4">Status</th>
                   <th className="p-4 text-center">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {fetching ? (
                   <tr>
                     <td colSpan={5} className="p-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                        <p className="text-sm font-bold text-gray-500">Mapeando endereços...</p>
                     </td>
                   </tr>
                 ) : enderecamentos.length > 0 ? (
                   enderecamentos.map(item => (
                    <tr key={item.id} className="hover:bg-indigo-50/20 transition group">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{item.produtos?.nome}</div>
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">#{item.produtos?.codigo}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{item.galpoes?.nome}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{item.corredores?.nome}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm">{item.caixas?.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm font-black text-gray-700">{item.quantidade}</span>
                          <span className="text-[9px] ml-1 text-gray-400 font-bold">UN</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest border" style={{ 
                            backgroundColor: `${item.status_estoque?.cor_hexa}20`, 
                            borderColor: item.status_estoque?.cor_hexa,
                            color: item.status_estoque?.cor_hexa 
                          }}>
                            {item.status_estoque?.descricao}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="text-amber-500 hover:text-amber-700 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition"
                          >
                            EDITAR
                          </button>
                        </td>
                    </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={5} className="p-12 text-center text-gray-400 italic text-sm">
                       Nenhum endereço físico registrado até o momento.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnderecamentoPage;
