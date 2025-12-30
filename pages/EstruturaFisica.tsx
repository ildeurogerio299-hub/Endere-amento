
import React, { useState, useEffect } from 'react';
import { Warehouse, Columns, Boxes, Package2, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Embalagem, StatusEstoque, Galpao, Corredor, Caixa } from '../types';
import CRUDButtons from '../components/CRUDButtons';

type SubTab = 'embalagens' | 'status' | 'galpoes' | 'corredores' | 'caixas';

const EstruturaFisica: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('embalagens');
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data States
  const [embalagens, setEmbalagens] = useState<Embalagem[]>([]);
  const [statusList, setStatusList] = useState<StatusEstoque[]>([]);
  const [galpoes, setGalpoes] = useState<Galpao[]>([]);
  const [corredores, setCorredores] = useState<Corredor[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);

  // Form States
  const [formEmbalagem, setFormEmbalagem] = useState<Partial<Embalagem>>({});
  const [formStatus, setFormStatus] = useState<Partial<StatusEstoque>>({});
  const [formGalpao, setFormGalpao] = useState<Partial<Galpao>>({});
  const [formCorredor, setFormCorredor] = useState<Partial<Corredor>>({});
  const [formCaixa, setFormCaixa] = useState<Partial<Caixa>>({});

  useEffect(() => {
    loadData(activeSubTab);
  }, [activeSubTab]);

  const loadData = async (tab: SubTab) => {
    setFetching(true);
    setMode('view');
    try {
      switch (tab) {
        case 'embalagens':
          const { data: emb } = await supabase.from('embalagens').select('*').order('nome');
          setEmbalagens(emb || []);
          break;
        case 'status':
          const { data: st } = await supabase.from('status_estoque').select('*').order('descricao');
          setStatusList(st || []);
          break;
        case 'galpoes':
          const { data: gl } = await supabase.from('galpoes').select('*').order('nome');
          setGalpoes(gl || []);
          break;
        case 'corredores':
          const { data: cr } = await supabase.from('corredores').select('*, galpoes(nome)').order('nome');
          setCorredores(cr || []);
          // Pre-load galpoes for the select
          const { data: gList } = await supabase.from('galpoes').select('*').order('nome');
          setGalpoes(gList || []);
          break;
        case 'caixas':
          const { data: cx } = await supabase.from('caixas').select('*, corredores(nome)').order('nome');
          setCaixas(cx || []);
          // Pre-load corredores for the select
          const { data: cList } = await supabase.from('corredores').select('*').order('nome');
          setCorredores(cList || []);
          break;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let table = '';
      let payload = {};
      let id = '';

      if (activeSubTab === 'embalagens') {
        table = 'embalagens';
        payload = { nome: formEmbalagem.nome, fator_conversao: formEmbalagem.fator_conversao };
        id = formEmbalagem.id || '';
      } else if (activeSubTab === 'status') {
        table = 'status_estoque';
        payload = { descricao: formStatus.descricao, cor_hexa: formStatus.cor_hexa };
        id = formStatus.id || '';
      } else if (activeSubTab === 'galpoes') {
        table = 'galpoes';
        payload = { nome: formGalpao.nome, localizacao: formGalpao.localizacao };
        id = formGalpao.id || '';
      } else if (activeSubTab === 'corredores') {
        table = 'corredores';
        payload = { nome: formCorredor.nome, galpao_id: formCorredor.galpao_id };
        id = formCorredor.id || '';
      } else if (activeSubTab === 'caixas') {
        table = 'caixas';
        payload = { nome: formCaixa.nome, corredor_id: formCaixa.corredor_id };
        id = formCaixa.id || '';
      }

      let error;
      if (mode === 'new') {
        const { error: err } = await supabase.from(table).insert([payload]);
        error = err;
      } else {
        const { error: err } = await supabase.from(table).update(payload).eq('id', id);
        error = err;
      }

      if (error) throw error;
      alert('Registro salvo com sucesso!');
      loadData(activeSubTab);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    if (activeSubTab === 'embalagens') setFormEmbalagem(item);
    if (activeSubTab === 'status') setFormStatus(item);
    if (activeSubTab === 'galpoes') setFormGalpao(item);
    if (activeSubTab === 'corredores') setFormCorredor(item);
    if (activeSubTab === 'caixas') setFormCaixa(item);
    setMode('edit');
  };

  const handleNew = () => {
    setFormEmbalagem({ nome: '', fator_conversao: 1 });
    setFormStatus({ descricao: '', cor_hexa: '#cccccc' });
    setFormGalpao({ nome: '', localizacao: '' });
    setFormCorredor({ nome: '', galpao_id: '' });
    setFormCaixa({ nome: '', corredor_id: '' });
    setMode('new');
  };

  const subTabsList = [
    { id: 'embalagens', label: 'Embalagens', icon: <Package2 className="w-4 h-4" /> },
    { id: 'status', label: 'Status', icon: <div className="w-3 h-3 rounded-full bg-indigo-500" /> },
    { id: 'galpoes', label: 'Galpões', icon: <Warehouse className="w-4 h-4" /> },
    { id: 'corredores', label: 'Corredores', icon: <Columns className="w-4 h-4" /> },
    { id: 'caixas', label: 'Caixas', icon: <Boxes className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 scrollbar-hide">
        {subTabsList.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as SubTab)}
            className={`flex items-center px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeSubTab === tab.id 
                ? 'bg-white border-indigo-600 text-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-indigo-600'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <CRUDButtons 
          mode={mode}
          onNew={handleNew}
          onSave={handleSave}
          onEdit={() => mode === 'view' && alert('Selecione um item na lista abaixo')}
          onCancel={() => confirm('Cancelar?') && setMode('view')}
          onDiscard={() => confirm('Descartar?') && setMode('view')}
          loading={loading}
        />

        {mode !== 'view' && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            {activeSubTab === 'embalagens' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Embalagem</label>
                  <input className="w-full p-2 border rounded" value={formEmbalagem.nome || ''} onChange={e => setFormEmbalagem({...formEmbalagem, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Conversão</label>
                  <input type="number" className="w-full p-2 border rounded" value={formEmbalagem.fator_conversao || ''} onChange={e => setFormEmbalagem({...formEmbalagem, fator_conversao: Number(e.target.value)})} />
                </div>
              </div>
            )}
            {activeSubTab === 'status' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Status</label>
                  <input className="w-full p-2 border rounded" value={formStatus.descricao || ''} onChange={e => setFormStatus({...formStatus, descricao: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor (Hexa)</label>
                  <div className="flex space-x-2">
                    <input type="color" className="p-1 h-10 w-12 border rounded" value={formStatus.cor_hexa || '#cccccc'} onChange={e => setFormStatus({...formStatus, cor_hexa: e.target.value})} />
                    <input className="flex-1 p-2 border rounded" value={formStatus.cor_hexa || ''} onChange={e => setFormStatus({...formStatus, cor_hexa: e.target.value})} />
                  </div>
                </div>
              </div>
            )}
            {activeSubTab === 'galpoes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Galpão</label>
                  <input className="w-full p-2 border rounded" value={formGalpao.nome || ''} onChange={e => setFormGalpao({...formGalpao, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localização/Endereço</label>
                  <input className="w-full p-2 border rounded" value={formGalpao.localizacao || ''} onChange={e => setFormGalpao({...formGalpao, localizacao: e.target.value})} />
                </div>
              </div>
            )}
            {activeSubTab === 'corredores' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Corredor</label>
                  <input className="w-full p-2 border rounded" value={formCorredor.nome || ''} onChange={e => setFormCorredor({...formCorredor, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Galpão Pertencente</label>
                  <select className="w-full p-2 border rounded" value={formCorredor.galpao_id || ''} onChange={e => setFormCorredor({...formCorredor, galpao_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {galpoes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                </div>
              </div>
            )}
            {activeSubTab === 'caixas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Caixa/Posição</label>
                  <input className="w-full p-2 border rounded" value={formCaixa.nome || ''} onChange={e => setFormCaixa({...formCaixa, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corredor Pertencente</label>
                  <select className="w-full p-2 border rounded" value={formCaixa.corredor_id || ''} onChange={e => setFormCaixa({...formCaixa, corredor_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {corredores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                <th className="px-4 py-3 border-b">Descrição/Nome</th>
                <th className="px-4 py-3 border-b">Info Adicional</th>
                <th className="px-4 py-3 border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetching ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Buscando dados...
                  </td>
                </tr>
              ) : (
                <>
                  {activeSubTab === 'embalagens' && embalagens.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Fator: {item.fator_conversao}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => handleEdit(item)} className="text-amber-500 font-bold text-xs">EDITAR</button></td>
                    </tr>
                  ))}
                  {activeSubTab === 'status' && statusList.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.cor_hexa }}></div>
                        {item.descricao}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.cor_hexa}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => handleEdit(item)} className="text-amber-500 font-bold text-xs">EDITAR</button></td>
                    </tr>
                  ))}
                  {activeSubTab === 'galpoes' && galpoes.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-indigo-600">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.localizacao || '-'}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => handleEdit(item)} className="text-amber-500 font-bold text-xs">EDITAR</button></td>
                    </tr>
                  ))}
                  {activeSubTab === 'corredores' && corredores.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Galpão: {(item as any).galpoes?.nome || '-'}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => handleEdit(item)} className="text-amber-500 font-bold text-xs">EDITAR</button></td>
                    </tr>
                  ))}
                  {activeSubTab === 'caixas' && caixas.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Corredor: {(item as any).corredores?.nome || '-'}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => handleEdit(item)} className="text-amber-500 font-bold text-xs">EDITAR</button></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EstruturaFisica;
