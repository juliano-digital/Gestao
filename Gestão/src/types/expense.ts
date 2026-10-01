/**
 * Tipagem para o objeto de Gasto e Parcela
 */

export interface Expense {
  id: string;
  local: string;
  valor: number;
  forma_pagamento: 'a_vista' | 'parcelado';
  numero_parcelas?: number;
  data_compra: string;
  responsavel: string;
  /** "Pago pelos dois" — calculado automaticamente a partir de paga_juliano && paga_lidiane */
  paga: boolean;
  /** Se o Juliano já pagou a parte dele desta compra */
  paga_juliano: boolean;
  /** Se a Lidiane já pagou a parte dela desta compra */
  paga_lidiane: boolean;
  /** Data/hora em que o Juliano marcou a parte dele como paga. null se ainda não pago. */
  data_pagamento_juliano?: string | null;
  /** Data/hora em que a Lidiane marcou a parte dela como paga. null se ainda não pago. */
  data_pagamento_lidiane?: string | null;
  created_at: string;
}

export type ExpenseFormData = Omit<
  Expense,
  | 'id'
  | 'created_at'
  | 'data_compra'
  | 'paga'
  | 'paga_juliano'
  | 'paga_lidiane'
  | 'data_pagamento_juliano'
  | 'data_pagamento_lidiane'
> & {
  data_compra?: string;
};

export interface Parcela {
  id: string;
  gasto_id: string;
  numero_parcela: number;
  valor_parcela: number;
  /** "Pago pelos dois" — calculado automaticamente a partir de paga_juliano && paga_lidiane */
  paga: boolean;
  /** Se o Juliano já pagou a parte dele desta parcela */
  paga_juliano: boolean;
  /** Se a Lidiane já pagou a parte dela desta parcela */
  paga_lidiane: boolean;
  /** Data combinada legada (mantida por compatibilidade) */
  data_pagamento?: string | null;
  /** Data/hora em que o Juliano marcou a parte dele desta parcela como paga. null se ainda não pago. */
  data_pagamento_juliano?: string | null;
  /** Data/hora em que a Lidiane marcou a parte dela desta parcela como paga. null se ainda não pago. */
  data_pagamento_lidiane?: string | null;
  created_at: string;
}