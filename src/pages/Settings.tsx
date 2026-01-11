import { CabinetManager } from "../components/components/ui/CabinetManager";
import { Settings as SettingsIcon, Package } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gray-900 text-white rounded-[2rem] shadow-xl">
          <SettingsIcon size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-gray-900 dark:text-white">
            Configurações VILAGI
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Gerenciamento de Inteligência e Estoque
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Seção do Gabinete */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-4">
            <Package size={18} className="text-pink-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
              Estoque de Auditoria
            </h2>
          </div>
          <CabinetManager />
        </section>
      </div>
    </div>
  );
}