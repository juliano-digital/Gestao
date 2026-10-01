/**
 * Página PersonNotes - Bloco de notas privado de uma pessoa (Juliano ou Lidiane)
 * Acessível apenas pela própria página da pessoa.
 *
 * Cada anotação pode ser editada (clicando no lápis, o card vira um campo
 * editável) e excluída (com um aviso de confirmação antes de apagar de
 * verdade).
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout, Card, Button } from '../components';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../types/note';

const PESSOAS_VALIDAS: Record<string, 'Juliano' | 'Lidiane'> = {
  juliano: 'Juliano',
  lidiane: 'Lidiane',
};

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
  return `${data} às ${hora}`;
};

export const PersonNotes: React.FC = () => {
  const { pessoa } = useParams<{ pessoa: string }>();
  const nomePessoa = pessoa ? PESSOAS_VALIDAS[pessoa.toLowerCase()] : undefined;

  const { notes, loading, error, addNote, editNote, removeNote } = useNotes(nomePessoa || 'Juliano');
  const [texto, setTexto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edição inline: qual anotação está sendo editada e o texto em edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTexto, setEditingTexto] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Aviso de confirmação antes de excluir
  const [noteParaExcluir, setNoteParaExcluir] = useState<Note | null>(null);

  if (!nomePessoa) {
    return (
      <Layout navbarTitle="Página não encontrada">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Pessoa não encontrada.</p>
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const handleAdd = async () => {
    if (!texto.trim()) return;
    try {
      setIsSaving(true);
      await addNote(texto.trim());
      setTexto('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditingTexto(note.texto);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTexto('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingTexto.trim()) return;
    try {
      setIsSavingEdit(true);
      await editNote(id, editingTexto.trim());
      setEditingId(null);
      setEditingTexto('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!noteParaExcluir) return;
    try {
      setDeletingId(noteParaExcluir.id);
      await removeNote(noteParaExcluir.id);
      setNoteParaExcluir(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout navbarTitle={`Notas de ${nomePessoa}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to={`/gastos/${nomePessoa.toLowerCase()}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Voltar para {nomePessoa}
        </Link>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Formulário de nova anotação */}
        <Card title="📝 Nova Anotação">
          <div className="space-y-4">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva sua anotação aqui..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-base resize-none"
            />
            <Button onClick={handleAdd} disabled={!texto.trim()} isLoading={isSaving}>
              Salvar Anotação
            </Button>
          </div>
        </Card>

        {/* Lista de anotações */}
        <Card title={`📋 Anotações de ${nomePessoa}`}>
          {loading ? (
            <p className="text-center text-gray-600 py-8">Carregando anotações...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Nenhuma anotação ainda.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const estaEditando = editingId === note.id;

                return (
                  <div
                    key={note.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-start gap-4"
                  >
                    {estaEditando ? (
                      <div className="flex-1 space-y-3">
                        <textarea
                          value={editingTexto}
                          onChange={(e) => setEditingTexto(e.target.value)}
                          rows={4}
                          autoFocus
                          className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-base resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={!editingTexto.trim() || isSavingEdit}
                            className="text-sm font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSavingEdit ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            className="text-sm font-semibold text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-gray-800 whitespace-pre-wrap break-words">{note.texto}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDateTime(note.created_at)}</p>
                      </div>
                    )}

                    {!estaEditando && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(note)}
                          title="Editar anotação"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-2 rounded transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setNoteParaExcluir(note)}
                          disabled={deletingId === note.id}
                          title="Apagar anotação"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded transition-colors disabled:opacity-50"
                        >
                          {deletingId === note.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Aviso de confirmação antes de excluir */}
      {noteParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800">🗑️ Excluir anotação?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Essa ação não pode ser desfeita. O texto abaixo será apagado permanentemente:
            </p>
            <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
              {noteParaExcluir.texto}
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setNoteParaExcluir(null)}
                disabled={deletingId === noteParaExcluir.id}
                className="flex-1 border border-gray-300 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === noteParaExcluir.id}
                className="flex-1 bg-red-600 text-white rounded-md py-2 font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === noteParaExcluir.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};