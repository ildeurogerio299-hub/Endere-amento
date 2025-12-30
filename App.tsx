
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import EstruturaFisica from './pages/EstruturaFisica';
import RecebimentoPage from './pages/Recebimento';
import EnderecamentoPage from './pages/Enderecamento';
import Relatorios from './pages/Relatorios';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'produtos':
        return <Produtos />;
      case 'apoio':
        return <EstruturaFisica />;
      case 'recebimento':
        return <RecebimentoPage />;
      case 'enderecamento':
        return <EnderecamentoPage />;
      case 'relatorios':
        return <Relatorios />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
