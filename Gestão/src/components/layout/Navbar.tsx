/**
 * Componente Navbar - Barra de navegação superior
 * Exibe título e navegação do aplicativo
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  title?: string;
}

/**
 * Componente de barra de navegação no topo da aplicação
 * @param title - Título a exibir na navbar
 */
export const Navbar: React.FC<NavbarProps> = ({ title = 'Controle de Gastos' }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <h1 className="text-2xl font-bold">{title}</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded transition-colors font-medium ${
                isActive('/') ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/gastos/juliano"
              className={`px-3 py-2 rounded transition-colors font-medium ${
                isActive('/gastos/juliano') ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
            >
              Juliano
            </Link>
            <Link
              to="/gastos/lidiane"
              className={`px-3 py-2 rounded transition-colors font-medium ${
                isActive('/gastos/lidiane') ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
            >
              Lidiane
            </Link>
            <Link
              to="/novo-gasto"
              className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded font-semibold transition-colors"
            >
              + Novo Gasto
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};