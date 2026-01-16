import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  isActive: boolean;
  patientId: string; // ✅ Obrigatório para diferenciar sessões de pacientes
}

export function SessionTimer({ isActive, patientId }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      // 1. Define a chave única para este paciente
      const storageKey = `timer_start_${patientId}`;
      
      // 2. Tenta recuperar o início salvo. Se não tiver, salva o AGORA.
      let startTime = localStorage.getItem(storageKey);

      if (!startTime) {
        startTime = Date.now().toString();
        localStorage.setItem(storageKey, startTime);
      }

      const startTimestamp = parseInt(startTime);

      // 3. Função que calcula a diferença real (Isso previne zerar no F5)
      const updateTimer = () => {
        const now = Date.now();
        // Math.max garante que não mostre tempo negativo
        setElapsed(Math.max(0, Math.floor((now - startTimestamp) / 1000)));
      };

      updateTimer(); // Atualiza imediatamente para não esperar 1s
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [isActive, patientId]);

  const format = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    // Se tiver mais de 1 hora, mostra HH:MM:SS, senão MM:SS
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-end">
       <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Duração</span>
       <div className="flex items-center gap-3">
           {/* Ícone adicionado para dar feedback visual */}
           <Clock size={20} className={isActive ? "text-emerald-400 animate-pulse" : "text-gray-600"} />
           
           <span className={`font-mono text-2xl font-black tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>
             {format(elapsed)}
           </span>
       </div>
    </div>
  );
}