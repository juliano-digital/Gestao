/**
 * Componente ConfirmDialog - modal genérico de confirmação, usado sempre
 * que uma ação precisa de um "tem certeza?" antes de acontecer de verdade
 * (por exemplo: desmarcar um pagamento já feito, para evitar clique
 * acidental que apague o registro de "pago").
 *
 * É controlado 100% por props: quem usa decide quando abrir/fechar e o que
 * acontece ao confirmar.
 */

import React from 'react';

interface ConfirmDialogProps {
  /** Controla se o modal está visível */
  isOpen: boolean;
  /** Título curto exibido no topo do modal */
  title: string;
  /** Texto explicando a ação que está prestes a acontecer */
  message: string;
  /** Texto do botão de confirmação (padrão: "Confirmar") */
  confirmLabel?: string;
  /** Texto do botão de cancelamento (padrão: "Cancelar") */
  cancelLabel?: string;
  /** Se true, mostra estado de carregando e desabilita os botões */
  isLoading?: boolean;
  /** Chamado quando o usuário confirma a ação */
  onConfirm: () => void;
  /** Chamado quando o usuário cancela ou fecha o modal */
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border border-gray-300 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white rounded-md py-2 font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};