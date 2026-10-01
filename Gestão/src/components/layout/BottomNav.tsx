/**
 * Componente BottomNav - Menu fixo inferior para mobile
 * Botão central ($) leva para Novo Gasto
 * Botões L e J levam para a página de gastos de cada pessoa
 * Visível apenas em telas mobile (escondido em md e acima)
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
      <div className="relative flex items-center justify-around h-[68px] max-w-md mx-auto px-4">
        {/* Botão Lidiane */}
        <button
          onClick={() => navigate('/gastos/lidiane')}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
          aria-label="Gastos da Lidiane"
        >
          <span
            className={`flex items-center justify-center w-11 h-11 rounded-full font-bold text-lg border-2 transition-all ${
              isActive('/gastos/lidiane')
                ? 'bg-pink-600 text-white border-pink-600 shadow-md scale-105'
                : 'bg-pink-50 text-pink-600 border-pink-200'
            }`}
          >
            L
          </span>
          <span
            className={`text-[11px] font-medium ${
              isActive('/gastos/lidiane') ? 'text-pink-600' : 'text-gray-400'
            }`}
          >
            Lidiane
          </span>
        </button>

        {/* Espaço reservado para o botão central flutuante */}
        <div className="w-16 flex-shrink-0" aria-hidden="true" />

        {/* Botão Juliano */}
        <button
          onClick={() => navigate('/gastos/juliano')}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
          aria-label="Gastos do Juliano"
        >
          <span
            className={`flex items-center justify-center w-11 h-11 rounded-full font-bold text-lg border-2 transition-all ${
              isActive('/gastos/juliano')
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            J
          </span>
          <span
            className={`text-[11px] font-medium ${
              isActive('/gastos/juliano') ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            Juliano
          </span>
        </button>

        {/* Botão central flutuante - Novo Gasto */}
        <button
          onClick={() => navigate('/novo-gasto')}
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold shadow-xl flex items-center justify-center hover:shadow-2xl active:scale-95 transition-all border-4 border-white"
          aria-label="Novo Gasto"
        >
          $
        </button>
      </div>
    </nav>
  );
};