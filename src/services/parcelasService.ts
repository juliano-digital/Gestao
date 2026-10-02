/**
 * Serviço para operações com parcelas de gastos parcelados
 */

import { supabase } from './supabaseClient';
import type { Parcela } from '../types/expense';

const TABLE_NAME = 'parcelas';

/**
 * Busca as parcelas de um gasto específico
 */
export const getParcelasByGastoId = async (gastoId: string): Promise<Parcela[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('gasto_id', gastoId)
    .order('numero_parcela', { ascending: true });

  if (error) {
    console.error('Erro ao buscar parcelas:', error);
    throw error;
  }

  return data || [];
};

/**
 * Busca todas as parcelas de todos os gastos (usado para calcular status "Pago")
 */
export const getAllParcelas = async (): Promise<Parcela[]> => {
  const { data, error } = await supabase.from(TABLE_NAME).select('*');

  if (error) {
    console.error('Erro ao buscar todas as parcelas:', error);
    throw error;
  }

  return data || [];
};

/**
 * Cria as parcelas de um gasto parcelado, dividindo o valor total igualmente.
 * A última parcela absorve qualquer diferença de arredondamento.
 *
 * Agora aceita o parâmetro opcional 'local' para salvar na coluna 'local' do Supabase.
 */
export const createParcelasForExpense = async (
  gastoId: string,
  valorTotal: number,
  numeroParcelas: number,
  local?: string // <- ADICIONADO AQUI (Parâmetro opcional para a localização/estabelecimento)
): Promise<void> => {
  const valorBase = Math.floor((valorTotal / numeroParcelas) * 100) / 100;
  const totalBase = valorBase * (numeroParcelas - 1);
  const valorUltima = Math.round((valorTotal - totalBase) * 100) / 100;

  const parcelas = Array.from({ length: numeroParcelas }, (_, i) => ({
    gasto_id: gastoId,
    numero_parcela: i + 1,
    valor_parcela: i === numeroParcelas - 1 ? valorUltima : valorBase,
    paga_juliano: false,
    paga_lidiane: false,
    local: local || null, // <- ADICIONADO AQUI: envia a string do local ou null se não for informada
  }));

  const { error } = await supabase.from(TABLE_NAME).insert(parcelas);

  if (error) {
    console.error('Erro ao criar parcelas:', error);
    throw error;
  }
};

/**
 * Atualiza o campo 'local' de uma parcela específica isoladamente
 */
export const updateLocalParcela = async (id: string, local: string): Promise<Parcela> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ local })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar local da parcela:', error);
    throw error;
  }

  return data;
};

/**
 * Marca ou desmarca uma parcela como paga para AMBAS as pessoas de uma vez
 */
export const toggleParcelaPaga = async (id: string, paga: boolean): Promise<Parcela> => {
  const dataPagamento = paga ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      paga_juliano: paga,
      paga_lidiane: paga,
      data_pagamento_juliano: dataPagamento,
      data_pagamento_lidiane: dataPagamento,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar parcela:', error);
    throw error;
  }

  return data;
};

/**
 * Marca ou desmarca a parte de UMA pessoa (Juliano ou Lidiane) como paga
 */
export const toggleParcelaPagaPessoa = async (
  id: string,
  pessoa: 'Juliano' | 'Lidiane',
  novoPaga: boolean
): Promise<Parcela> => {
  const campoPaga = pessoa === 'Juliano' ? 'paga_juliano' : 'paga_lidiane';
  const campoData = pessoa === 'Juliano' ? 'data_pagamento_juliano' : 'data_pagamento_lidiane';

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      [campoPaga]: novoPaga,
      [campoData]: novoPaga ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar parcela por pessoa:', error);
    throw error;
  }

  return data;
};