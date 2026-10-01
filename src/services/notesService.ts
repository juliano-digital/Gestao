/**
 * Serviço para operações CRUD de anotações no Supabase
 */

import { supabase } from './supabaseClient';
import type { Note } from '../types/note';

const TABLE_NAME = 'anotacoes';

/**
 * Busca todas as anotações de uma pessoa específica
 */
export const getNotesByPessoa = async (pessoa: 'Juliano' | 'Lidiane'): Promise<Note[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('pessoa', pessoa)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar anotações:', error);
    throw error;
  }

  return data || [];
};

/**
 * Cria uma nova anotação
 */
export const createNote = async (pessoa: 'Juliano' | 'Lidiane', texto: string): Promise<Note> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ pessoa, texto }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar anotação:', error);
    throw error;
  }

  return data;
};

/**
 * Atualiza o texto de uma anotação existente
 */
export const updateNote = async (id: string, texto: string): Promise<Note> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ texto })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar anotação:', error);
    throw error;
  }

  return data;
};

/**
 * Deleta uma anotação
 */
export const deleteNote = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar anotação:', error);
    throw error;
  }
};