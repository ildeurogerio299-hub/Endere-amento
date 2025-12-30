
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Package, Truck, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Produtos', value: '0', icon: <Package className="text-indigo-600" />, color: 'bg-indigo-50' },
    { label: 'NF Pendentes', value: '0', icon: <Truck className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Endereçados', value: '0', icon: <MapPin className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Avarias', value: '0', icon: <AlertCircle className="text-red-600" />, color: 'bg-red-50' },
  ]);
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Contagens Básicas
      const { count: prodCount } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
      const { count: nfPendente } = await supabase.from('recebimentos').select('*', { count: 'exact', head: true }).eq('status', 'Pendente');
      const { data: endData } = await supabase.from('enderecamento').select('quantidade, status_estoque(descricao)');
      
      const totalEnderecado = endData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;
      
      // Fix for: Property 'descricao' does not exist on type '{ descricao: any; }[]'.
      // Handled status_estoque which can be returned as an array or object in Supabase joins depending on relationship detection.
      const avarias = (endData as any[])?.filter(i => {
        const status = Array.isArray(i.status_estoque) ? i.status_estoque[0] : i.status_estoque;
        return status?.descricao?.toLowerCase().includes('avari');
      }).reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;

      setStats([
        { label: 'Total Produtos', value: prodCount?.toString() || '0', icon: <Package className="text-indigo-600" />, color: 'bg-indigo-50' },
        { label: 'NF Pendentes', value: nfPendente?.toString() || '0', icon: <Truck className="text-amber-600" />, color: 'bg-amber-50' },
        { label: 'Endereçados', value: totalEnderecado.toLocaleString(), icon: <MapPin className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Avarias', value: avarias.toString(), icon: <AlertCircle className="text-red-600" />, color: 'bg-red-50' },
      ]);

      // 2. Ocupação por Galpão
      const { data: occData } = await supabase.from('enderecamento').select('quantidade, galpoes(nome)');
      const groupedByGalpao = (occData as any[])?.reduce((acc: any, curr: any) => {
        const galpao = Array.isArray(curr.galpoes) ? curr.galpoes[0] : curr.galpoes;
        const name = galpao?.nome || 'Não Definido';
        acc[name] = (acc[name] || 0) + curr.quantidade;
        return acc;
      }, {});
      setBarData(Object.keys(groupedByGalpao || {}).map(key => ({ name: key, qtd: groupedByGalpao[key] })));

      // 3. Status
      const groupedByStatus = (endData as any[])?.reduce((acc: any, curr: any) => {
        const status = Array.isArray(curr.status_estoque) ? curr.status_estoque[0] : curr.status_estoque;
        const name = status?.descricao || 'Outros';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      setPieData(Object.keys(groupedByStatus || {}).map(key => ({ name: key, value: groupedByStatus[key] })));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
        <p className="font-bold text-lg">Consolidando dados do armazém...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">{stat.label}</p>
              <p className="text-2xl font-black text-gray-800 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black mb-6 text-gray-400 uppercase tracking-widest">Ocupação por Galpão (Qtd)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="qtd" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black mb-6 text-gray-400 uppercase tracking-widest">Mix de Status (Posições)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                <div className="w-2.5 h-2.5 rounded-full mr-1.5 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
