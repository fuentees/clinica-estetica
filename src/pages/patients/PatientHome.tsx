import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, ImageIcon, Loader2, Printer, Camera, Clock, ChevronRight, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PatientPortalHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    async function loadHistory() {
      if (!user?.email) return;
      try {
        setLoading(true);
        
        // 1. Pega o ID do paciente vinculado ao email do login
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('email', user.email)
          .single();

        if (patient) {
          // 2. Busca Receitas Realacionadas
          const { data: presc } = await supabase
            .from('prescriptions')
            .select(`
              *,
              professional:profiles!professionalId ( first_name, last_name, signature_data, registration_number, formacao )
            `)
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false });

          // 3. Busca Galeria (do tratamento ativo)
          const { data: treat } = await supabase
            .from('patient_treatments')
            .select('photos')
            .eq('patient_id', patient.id)
            .eq('status', 'active')
            .maybeSingle();

          setPrescriptions(presc || []);
          setPhotos(treat?.photos || []);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const printPrescription = (p: any) => {
    const dateStr = format(new Date(p.date), 'dd/MM/yyyy');
    const prof = p.professional || {};
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receita - ${dateStr}</title>
          <style>
            body { font-family: sans-serif; padding: 50px; color: #333; line-height: 1.5; }
            .header { border-bottom: 4px solid #db2777; padding-bottom: 20px; margin-bottom: 40px; }
            .med-item { margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 15px; border: 1px solid #eee; }
            .footer { margin-top: 60px; text-align: center; border-top: 2px solid #eee; padding-top: 30px; }
            .sig { max-height: 100px; margin-bottom: 10px; }
            h1 { font-style: italic; font-weight: 900; color: #111; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RECOMENDAÇÃO TERAPÊUTICA</h1>
            <p><strong>DATA DE EMISSÃO:</strong> ${dateStr}</p>
          </div>
          ${p.medications.map((m: any) => `
            <div class="med-item">
              <strong style="font-size: 18px; text-transform: uppercase;">${m.name}</strong><br/>
              <div style="margin-top: 8px; color: #666;">${m.observations || 'Sem observações adicionais.'}</div>
            </div>
          `).join('')}
          <div class="footer">
            ${prof.signature_data ? `<img src="${prof.signature_data}" class="sig" /><br/>` : ''}
            <div style="font-weight: bold; text-transform: uppercase;">Dr(a). ${prof.first_name} ${prof.last_name}</div>
            <div style="font-size: 12px; color: #999;">${prof.formacao || 'Especialista'} | ${prof.registration_number || ''}</div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="animate-spin text-rose-600 w-10 h-10" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-4">Sincronizando Prontuário...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 space-y-16 animate-in fade-in duration-700">
      
      {/* SEÇÃO: RECEITAS */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-600 text-white rounded-[1.5rem] shadow-lg shadow-rose-200 dark:shadow-none">
            <FileText size={28}/>
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">Minhas Receitas</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Prescrições e orientações homecare</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-gray-800 rounded-[2rem] text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase italic tracking-widest">Nenhuma receita disponível no momento.</p>
            </div>
          ) : prescriptions.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-rose-300 hover:shadow-xl transition-all duration-500">
              <div className="flex-1">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                    {format(new Date(p.date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight uppercase italic truncate pr-4">
                    {p.notes || "Prescrição"}
                </h3>
              </div>
              <button 
                onClick={() => printPrescription(p)} 
                className="h-14 w-14 flex items-center justify-center bg-gray-900 hover:bg-rose-600 text-white rounded-2xl shadow-lg transition-all active:scale-95"
              >
                <Printer size={22} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO: GALERIA */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-200 dark:shadow-none">
            <Camera size={28}/>
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">Minha Evolução</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Registro visual do seu tratamento</p>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
            <ImageIcon className="mx-auto text-gray-200 mb-6" size={64} />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">As fotos da sua evolução serão publicadas aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {photos.map((url, i) => (
              <div key={i} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <img src={url} className="w-full h-full object-cover" alt={`Evolução ${i + 1}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Registro #{i+1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}