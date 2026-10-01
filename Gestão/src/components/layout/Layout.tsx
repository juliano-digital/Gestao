/**
 * Componente Layout - Wrapper que envolve as páginas
 * Fornece estrutura consistente com Navbar, conteúdo e menu fixo mobile
 */

import React from 'react';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  navbarTitle?: string;
}

/**
 * Componente de layout que encapsula a estrutura da página
 * @param children - Conteúdo da página
 * @param navbarTitle - Título da navbar
 */
export const Layout: React.FC<LayoutProps> = ({ children, navbarTitle }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar title={navbarTitle} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 pb-24 md:pb-10">
        {children}
      </main>
      <footer className="bg-gray-800 text-gray-300 py-8 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-sm">
            <p>&copy; 2026 Controle de Gastos. Desenvolvido por Juliano</p>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
};