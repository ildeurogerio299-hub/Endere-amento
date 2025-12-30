
import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Produto } from '../types';
import CRUDButtons from '../components/CRUDButtons';
import { supabase } from '../lib/supabase';

const Produtos: React.FC = () => {
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState<Partial<Produto>>({
    codigo: '',
    nome: '',
    descricao: '',
    unidade_medida: 'UN'
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      alert('Erro ao carregar lista de produtos.');
    } finally {
      setFetching(false);
    }
  };

  const handleNew = () => {
    setFormData({ codigo: '', nome: '', descricao: '', unidade_medida: 'UN' });
    setMode('new');
  };

  const handleEdit = (produto: Produto) => {
    setFormData(produto);
    setMode('edit');
  };

  const handleCancel = () => {
    if (confirm("Tem certeza que deseja cancelar? Alterações não salvas serão perdidas.")) {
      setMode('view');
    }
  };

  const handleDiscard = () => {
    if (confirm("Tem certeza que deseja descartar este cadastro?")) {
      setMode('view');
    }
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.nome) {
      alert("Preencha os campos obrigatórios (Código e Nome)!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao,
        unidade_medida: formData.unidade_medida
      };

      let error;
      if (mode === 'new') {
        const { error: insertError } = await supabase
          .from('produtos')
          .insert([payload]);
        error = insertError;
      } else {
        const { error: updateError } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', formData.id);
        error = updateError;
      }

      if (error) throw error;

      alert('Produto salvo com sucesso!');
      setMode('view');
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <CRUDButtons 
        mode={mode}
        onNew={handleNew}
        onSave={handleSave}
        onEdit={() => mode === 'view' && alert('Selecione um produto na lista abaixo para editar clicando em "EDITAR"')}
        onCancel={handleCancel}
        onDiscard={handleDiscard}
        loading={loading}
      />

      {mode !== 'view' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código do Produto *</label>
            <input 
              type="text" 
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={formData.codigo}
              onChange={e => setFormData({...formData, codigo: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input 
              type="text" 
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Medida</label>
            <select 
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={formData.unidade_medida}
              onChange={e => setFormData({...formData, unidade_medida: e.target.value})}
            >
              <option value="UN">Unidade (UN)</option>
              <option value="KG">Quilo (KG)</option>
              <option value="CX">Caixa (CX)</option>
              <option value="MT">Metro (MT)</option>
              <option value="LT">Litro (LT)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea 
              rows={2}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
            ></textarea>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-bold text-gray-800">Listagem de Produtos</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou código..." 
              className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                <th className="px-4 py-3 border-b">Código</th>
                <th className="px-4 py-3 border-b">Nome</th>
                <th className="px-4 py-3 border-b">U.M.</th>
                <th className="px-4 py-3 border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetching ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Carregando produtos...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition group">
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600">{p.codigo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{p.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.unidade_medida}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleEdit(p)}
                        disabled={mode !== 'view'}
                        className="text-amber-500 hover:text-amber-700 text-xs font-bold uppercase disabled:opacity-30"
                      >
                        EDITAR
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm italic">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Produtos;
