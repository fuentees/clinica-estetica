import { Outlet } from "react-router-dom";

export function Layout() {
  console.log("✅ Layout carregado!");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-500">🎉 Layout Carregado!</h1>
      <p>Se você está vendo isso, significa que o Layout está funcionando!</p>
      
      <div className="bg-gray-200 p-4 rounded-lg mt-4">
        <h2 className="text-lg font-semibold">🔽 Conteúdo da Página:</h2>
        <Outlet />  {/* Aqui será carregado o conteúdo das páginas */}
      </div>
    </div>
  );
}
