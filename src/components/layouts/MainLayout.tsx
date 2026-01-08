import { Outlet } from 'react-router-dom'; // Se estiver usando React Router
import { Sidebar } from '../Sidebar';

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 1. Sidebar fixa na esquerda */}
      <Sidebar />

      {/* 2. Área de Conteúdo (que muda conforme a rota) */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet /> 
      </main>
    </div>
  );
}