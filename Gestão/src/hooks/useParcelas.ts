/**
 * Hooks para gerenciar parcelas: as de um gasto específico e o total geral
 */

import { useState, useEffect, useCallback } from 'react';
import type { Parcela } from '../types/expense';
import {
  getParcelasByGastoId,
  getAllParcelas,
  toggleParcelaPaga,
  toggleParcelaPagaPessoa,
} from '../services/parcelasService';

interface UseParcelasReturn {
  parcelas: Parcela[];
  loading: boolean;
  error: string | null;
  togglePaga: (id: string, novoPaga: boolean) => Promise<Parcela>;
  togglePagaPessoa: (
    id: string,
    pessoa: 'Juliano' | 'Lidiane',
    novoPaga: boolean
  ) => Promise<Parcela>;
}

/**
 * Hook para gerenciar as parcelas de um gasto específico
 * @param gastoId - ID do gasto (ou null se não houver gasto selecionado)
 */
export const useParcelas = (gastoId: string | null): UseParcelasReturn => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParcelas = useCallback(async () => {
    if (!gastoId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getParcelasByGastoId(gastoId);
      setParcelas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar parcelas');
    } finally {
      setLoading(false);
    }
  }, [gastoId]);

  useEffect(() => {
    fetchParcelas();
  }, [fetchParcelas]);

  const togglePaga = async (id: string, novoPaga: boolean): Promise<Parcela> => {
    try {
      const updated = await toggleParcelaPaga(id, novoPaga);
      setParcelas((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar parcela');
      throw err;
    }
  };

  const togglePagaPessoa = async (
    id: string,
    pessoa: 'Juliano' | 'Lidiane',
    novoPaga: boolean
  ): Promise<Parcela> => {
    try {
      const updated = await toggleParcelaPagaPessoa(id, pessoa, novoPaga);
      setParcelas((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar parcela da pessoa');
      throw err;
    }
  };

  return { parcelas, loading, error, togglePaga, togglePagaPessoa };
};

interface UseAllParcelasReturn {
  parcelas: Parcela[];
  loading: boolean;
  refetch: () => Promise<void>;
  /**
   * Atualiza (ou insere) UMA parcela específica no estado local, sem
   * precisar rebuscar a lista inteira do banco. Usar isso em vez de
   * `refetch()` depois de um toggle evita condição de corrida quando o
   * usuário clica em vários toggles rapidamente (cada clique atualiza só
   * o item que ele mesmo mudou, sem depender da ordem de chegada das
   * respostas do servidor).
   */
  updateLocal: (parcela: Parcela) => void;
}

/**
 * Hook para buscar TODAS as parcelas (usado para calcular status "Pago" no
 * Dashboard, a lista de "Parcelas Pendentes", e o card de "Falta Pagar").
 * Expõe `refetch` para recarregar tudo do zero quando necessário, e
 * `updateLocal` para atualizar um item específico sem race condition.
 */
export const useAllParcelas = (): UseAllParcelasReturn => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllParcelas();
      setParcelas(data);
    } catch (err) {
      console.error('Erro ao buscar todas as parcelas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateLocal = useCallback((parcela: Parcela) => {
    setParcelas((prev) => prev.map((p) => (p.id === parcela.id ? parcela : p)));
  }, []);

  return { parcelas, loading, refetch: fetchAll, updateLocal };
};