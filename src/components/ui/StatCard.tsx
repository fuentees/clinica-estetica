import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: "green" | "blue" | "pink" | "purple" | "orange";
  customColor?: string; // Para usar a cor da clínica
}

export function StatCard({ title, value, sub, icon, color = "blue", customColor }: StatCardProps) {
  const colors = {
    green: "from-green-500 to-emerald-600 shadow-green-100 text-green-600",
    blue: "from-blue-500 to-indigo-600 shadow-blue-100 text-blue-600",
    pink: "from-pink-500 to-rose-600 shadow-pink-100 text-pink-600",
    purple: "from-purple-500 to-violet-600 shadow-purple-100 text-purple-600",
    orange: "from-orange-500 to-amber-600 shadow-orange-100 text-orange-600",
  };

  const style = colors[color];
  // Se tiver cor customizada, usamos ela no ícone
  const iconStyle = customColor ? { backgroundColor: customColor, color: 'white' } : {};
  const gradientClass = !customColor ? `bg-gradient-to-br ${style.split(' ').slice(0, 2).join(' ')} text-white` : '';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div 
          className={`p-3 rounded-2xl shadow-lg flex items-center justify-center ${gradientClass}`} 
          style={iconStyle}
        >
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Métrica</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1 font-medium">{title}</p>
        <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{value}</h3>
      </div>
      {sub && (
        <div className="mt-4 flex items-center gap-1 text-xs font-bold text-gray-400">
          <ArrowUpRight size={14} className={!customColor ? style.split(' ').pop() : ''} style={customColor ? { color: customColor } : {}} />
          {sub}
        </div>
      )}
    </div>
  );
}