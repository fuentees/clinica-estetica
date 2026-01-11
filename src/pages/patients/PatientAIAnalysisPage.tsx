import { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { 
  ShieldCheck, AlertTriangle, BrainCircuit, Syringe, 
  FlaskConical, Home, Printer, Copy, CheckCircle
} from "lucide-react"; 
import { AnamnesisAIService } from "../../services/anamnesisAIService";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

export default function AIAnalysisPage() {
  const { id } = useParams();
  const { patient } = useOutletContext<any>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAnalysis() {
      const result = await AnamnesisAIService.analyzeAnamnesis(id!, patient);
      setReport(result);
      setLoading(false);
    }
    getAnalysis();
  }, [id, patient]);

  if (loading) return <div className="p-20 text-center animate-pulse">Gerando Laudo VILAGI...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER STATUS */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-8 rounded-[2rem] border shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${report.safetyScore < 70 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">VILAGI CLINICAL AI™</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Score de Segurança: {report.safetyScore}%</p>
          </div>
        </div>
        <Button onClick={() => window.print()} className="bg-gray-900 text-white rounded-xl h-12 px-6 font-bold uppercase text-[10px]">
          <Printer className="mr-2" size={16} /> Imprimir Laudo Técnico
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUNA 1: SEGURANÇA */}
        <div className="space-y-6">
          <section className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
            <h3 className="text-rose-700 font-black text-xs uppercase mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> Bloqueios e Alertas
            </h3>
            <div className="space-y-3">
              {report.contraindicacoes.map((c:string, i:number) => (
                <p key={i} className="text-xs text-rose-900 font-bold bg-white p-3 rounded-xl border border-rose-200">❌ {c}</p>
              ))}
              {report.alertas.map((a:string, i:number) => (
                <p key={i} className="text-[11px] text-amber-700 italic">⚠️ {a}</p>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 p-6 rounded-[2rem] text-white">
             <h3 className="text-pink-500 font-black text-[10px] uppercase mb-3">Justificativa Clínica</h3>
             <p className="text-sm italic opacity-80 leading-relaxed">"{report.justificativa || 'Protocolo otimizado conforme biotipo.'}"</p>
          </section>
        </div>

        {/* COLUNA 2 E 3: PLANO TÉCNICO */}
        <div className="md:col-span-2 space-y-6">
          
          {/* MAPA DE INJETÁVEIS */}
          <section className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border shadow-sm">
            <h3 className="text-emerald-600 font-black text-xs uppercase mb-6 flex items-center gap-2">
              <Syringe size={18} /> Harmonização e Doses Sugeridas
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Toxina (Unidades)</span>
                  {Object.entries(report.botox).map(([area, unit]) => (
                    <div key={area} className="flex justify-between mt-1 border-b pb-1 text-sm">
                      <span>{area}</span> <span className="font-bold text-pink-600">{unit as number}u</span>
                    </div>
                  ))}
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Preenchimento (ml)</span>
                  {Object.entries(report.preenchimento).map(([area, vol]) => (
                    <div key={area} className="flex justify-between mt-1 border-b pb-1 text-[11px]">
                      <span>{area}</span> <span className="font-bold text-emerald-600">{vol as string}</span>
                    </div>
                  ))}
               </div>
            </div>
          </section>

          {/* ATIVOS E HOMECARE */}
          <div className="grid grid-cols-2 gap-6">
             <section className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
                <h3 className="text-purple-700 font-black text-xs uppercase mb-4 flex items-center gap-2">
                  <FlaskConical size={16} /> Ativos Drug Delivery
                </h3>
                {report.suggested_actives.map((a:any, i:number) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs font-bold text-purple-900">{a.name}</p>
                    <p className="text-[10px] text-purple-600">{a.reason}</p>
                  </div>
                ))}
             </section>

             <section className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                <h3 className="text-blue-700 font-black text-xs uppercase mb-4 flex items-center gap-2">
                  <Home size={16} /> Home Care Obrigatório
                </h3>
                <div className="text-[10px] space-y-2">
                   <p><strong>AM:</strong> {report.homecare.morning.join(' → ')}</p>
                   <p><strong>PM:</strong> {report.homecare.night.join(' → ')}</p>
                </div>
             </section>
          </div>

        </div>
      </div>
    </div>
  );
}