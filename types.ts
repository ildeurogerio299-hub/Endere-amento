
export interface Usuario {
  id: string;
  email: string;
  nome: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  usuario_id: string;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  unidade_medida: string;
}

export interface Embalagem {
  id: string;
  nome: string;
  fator_conversao: number;
}

export interface StatusEstoque {
  id: string;
  descricao: string;
  cor_hexa: string;
}

export interface Galpao {
  id: string;
  nome: string;
  localizacao?: string;
}

export interface Corredor {
  id: string;
  nome: string;
  galpao_id: string;
}

export interface Caixa {
  id: string;
  nome: string;
  corredor_id: string;
}

export interface Recebimento {
  id: string;
  numero_nf: string;
  data_recebimento: string;
  fornecedor: string;
  status: 'Pendente' | 'Processado' | 'Cancelado';
}

export interface DetalheRecebimento {
  id: string;
  recebimento_id: string;
  produto_id: string;
  quantidade: number;
  embalagem_id: string;
  valor_unitario: number;
}

export interface Enderecamento {
  id: string;
  produto_id: string;
  recebimento_id?: string; // Link opcional para rastreabilidade
  galpao_id: string;
  corredor_id: string;
  caixa_id: string;
  quantidade: number;
  data_cadastro: string;
  cadastrado_por: string; // Colaborador ID
  status_estoque_id: string;
}
