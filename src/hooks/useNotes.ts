/**
 * Hook para gerenciar as anotações de uma pessoa
 */

import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types/note';
import { getNotesByPessoa, createNote, updateNote, deleteNote } from '../services/notesService';

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  addNote: (texto: string) => Promise<void>;
  editNote: (id: string, texto: string) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

export const useNotes = (pessoa: 'Juliano' | 'Lidiane'): UseNotesReturn => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotesByPessoa(pessoa);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar anotações');
    } finally {
      setLoading(false);
    }
  }, [pessoa]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (texto: string) => {
    try {
      setError(null);
      const newNote = await createNote(pessoa, texto);
      setNotes((prev) => [newNote, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar anotação');
      throw err;
    }
  };

  const editNote = async (id: string, texto: string) => {
    try {
      setError(null);
      const updated = await updateNote(id, texto);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar anotação');
      throw err;
    }
  };

  const removeNote = async (id: string) => {
    try {
      setError(null);
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar anotação');
      throw err;
    }
  };

  return { notes, loading, error, addNote, editNote, removeNote };
};