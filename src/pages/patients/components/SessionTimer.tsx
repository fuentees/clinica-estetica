import { useState, useEffect } from "react";

// ✅ A interface define que ele ACEITA isActive
interface SessionTimerProps {
  isActive: boolean;
}

export function SessionTimer({ isActive }: SessionTimerProps) {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    let interval: any;
    if (isActive) interval = setInterval(() => setSeconds(s => s + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isActive]);

  const format = (v: number) => {
    const m = Math.floor(v / 60).toString().padStart(2, '0');
    const s = (v % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-end">
       <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Duração</span>
       <span className={`font-mono text-2xl font-bold ${isActive ? 'text-white animate-pulse' : 'text-gray-500'}`}>
         {format(seconds)}
       </span>
    </div>
  );
}