
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  MapPin, 
  BarChart3, 
  Menu, 
  X,
  Warehouse,
  Boxes,
  Layers
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'produtos', label: 'Produtos', icon: <Package className="w-5 h-5" /> },
    { id: 'apoio', label: 'Cadastros de Apoio', icon: <Layers className="w-5 h-5" /> },
    { id: 'recebimento', label: 'Recebimento (NF)', icon: <Truck className="w-5 h-5" /> },
    { id: 'enderecamento', label: 'Endereçamento', icon: <MapPin className="w-5 h-5" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 z-50`}>
        <div className="p-4 flex items-center justify-between border-b border-indigo-800">
          {sidebarOpen && <h1 className="text-xl font-bold tracking-tight">Endereçamento</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-indigo-800 rounded">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        <nav className="flex-1 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-4 transition-colors hover:bg-indigo-800 ${
                activeTab === item.id ? 'bg-indigo-700 border-r-4 border-indigo-400' : ''
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="ml-4 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800 text-xs text-indigo-300">
          {sidebarOpen ? 'v1.0.0 - FASE 5' : 'v1.0'}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between sticky top-0 z-40">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Usuário: <span className="font-bold text-gray-700">Almoxarifado</span></span>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
