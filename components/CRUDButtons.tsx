
import React from 'react';
import { Plus, Save, Edit, XCircle, Loader2 } from 'lucide-react';

interface CRUDButtonsProps {
  mode: 'view' | 'edit' | 'new';
  onNew: () => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDiscard?: () => void;
  loading?: boolean;
}

const CRUDButtons: React.FC<CRUDButtonsProps> = ({ 
  mode, 
  onNew, 
  onSave, 
  onEdit, 
  onCancel,
  onDiscard,
  loading 
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {mode === 'view' ? (
        <>
          <button
            onClick={onNew}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Registro
          </button>
          <button
            onClick={onEdit}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition disabled:opacity-50 font-medium text-sm shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" /> Alterar
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition disabled:opacity-50 font-medium text-sm shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition disabled:opacity-50 font-medium text-sm shadow-sm"
          >
            <XCircle className="w-4 h-4 mr-2" /> Cancelar
          </button>
          {onDiscard && (
            <button
              onClick={onDiscard}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 font-medium text-sm shadow-sm"
            >
              <XCircle className="w-4 h-4 mr-2" /> Descartar
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CRUDButtons;
