/**
 * Hook genérico de paginação — funciona com qualquer lista (gastos, parcelas, locais...)
 * Corta o array em páginas de N itens e controla qual página está ativa
 */
import { useState, useMemo, useEffect } from 'react';

interface UsePaginationOptions {
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  paginatedItems: T[];
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
}

export function usePagination<T>(
  items: T[],
  { itemsPerPage = 7 }: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Se a lista encolher (ex: trocou o filtro de mês) e a página atual
  // deixar de existir, volta pra página 1 automaticamente
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return { paginatedItems, currentPage, totalPages, goToPage };
}