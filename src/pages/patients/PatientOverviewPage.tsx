import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Activity, Scale, ArrowRight, Loader2, Calendar, History, Clock3, User, FileText, Sparkles, Ban, Pencil
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { PatientPackagesWidget } from "../../components/patients/PatientPackagesWidget";

export default function PatientOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState<any>({
    appointments: [], 
    lastAppointment: null, 
    nextAppointment: null, 
    totalSessions: 0,
    lastBio: [], 
  });

  async function loadOverview() {
    if (!id) return;
    try {
      const { data: appts } = await supabase.from("appointments")
          .select(`id, date, start_time, status, notes, treatment:treatment_id (name), professional:professional_id (first_name, last_name)`)
          .eq("patient_id", id).order("date", { ascending: false });

      const appointments = appts || [];
      const completed = appointments.filter((a: any) => a.status === 'completed');
      const next = appointments.filter((a: any) => new Date(a.date) >= new Date() && a.status === 'scheduled')
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      const { data: bio } = await supabase.from("bioimpedance").select("*").eq("patient_id", id).order("data_avaliacao", { ascending: false }).limit(2);

      setData({
          appointments: appointments,
          lastAppointment: completed[0] || null,
          nextAppointment: next || null,
          totalSessions: completed.length,
          lastBio: bio || []
      });
    } catch (error) { console.error(error); }
  }

  useEffect(() => {
    setLoading(true);
    loadOverview().then(() => setLoading(false));
  }, [id]);

  const handleCancelAppointment = async (apptId: string) => {
      if (!window.confirm("Cancelar este agendamento?")) return;
      await supabase.from('appointments').update({ status: 'canceled' }).eq('id', apptId);
      toast.success("Cancelado!");
      loadOverview();
  };

  const getStatusColor = (s: string) => s === 'confirmed' ? 'bg-green-100 text-green-700' : s === 'completed' ? 'bg-blue-100 text-blue-700' : s === 'canceled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-8 h-8"/></div>;
  const bio = data.lastBio?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 p-2">
      <div className="lg:col-span-2 space-y-8">
          {/* CARDS PREMIUM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative overflow-hidden p-6 rounded-3xl border border-white/60 dark:border-gray-700 shadow-xl shadow-pink-100 dark:shadow-none bg-white dark:bg-gray-800">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between mb-4"><div className="p-3 bg-pink-100 rounded-2xl text-pink-600"><Activity/></div><span className="text-xs font-bold uppercase text-gray-400">Resumo</span></div>
                    <h3 className="text-4xl font-black text-gray-800 dark:text-white mb-1">{data.totalSessions}</h3>
                    <p className="text-sm text-gray-500 mb-6">Sessões realizadas</p>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Último</p>
                        <p className="font-bold text-gray-800 dark:text-white truncate">{data.lastAppointment?.treatment?.name || "Nenhum"}</p>
                    </div>
                </div>
            </div>
            <div className="relative overflow-hidden p-6 rounded-3xl border border-white/60 dark:border-gray-700 shadow-xl shadow-blue-100 dark:shadow-none bg-white dark:bg-gray-800">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between mb-4"><div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><Scale/></div><span className="text-xs font-bold uppercase text-gray-400">Corporal</span></div>
                    {bio ? <><h3 className="text-4xl font-black text-gray-800 dark:text-white">{bio.peso}kg</h3><p className="text-sm text-gray-500 mb-6">em {new Date(bio.data_avaliacao).toLocaleDateString('pt-BR')}</p></> : <p className="text-gray-400 py-8">Sem dados</p>}
                    <Button variant="ghost" onClick={() => navigate("bioimpedance")} className="w-full text-xs text-blue-600">Ver Gráficos <ArrowRight size={12}/></Button>
                </div>
            </div>
          </div>

          {/* HISTÓRICO COM AÇÕES */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-8 py-6 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="text-lg font-bold flex gap-2"><History className="text-pink-500"/> Histórico</h3><Button onClick={() => navigate('/appointments/new')} size="sm" className="bg-pink-600 text-white">+ Novo</Button></div>
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                  {data.appointments.map((appt: any) => (
                      <div key={appt.id} className="group p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-pink-200 hover:shadow-md transition-all flex justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center min-w-[60px]"><span className="block text-2xl font-black">{new Date(appt.date).getDate()}</span></div>
                              <div><div className="flex items-center gap-1 text-sm font-bold"><Clock3 size={14}/> {appt.start_time.slice(0,5)}</div><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusColor(appt.status)}`}>{appt.status}</span></div>
                          </div>
                          <div className="flex-1"><h4 className="font-bold text-gray-900 dark:text-white">{appt.treatment?.name || 'Consulta'}</h4><div className="flex items-center gap-2 text-xs text-gray-500"><User size={12}/> {appt.professional?.first_name || '-'}</div></div>
                          {appt.status === 'scheduled' && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/appointments/${appt.id}/edit`)} className="text-blue-500 h-8 w-8 p-0 rounded-full"><Pencil size={16}/></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleCancelAppointment(appt.id)} className="text-red-500 h-8 w-8 p-0 rounded-full"><Ban size={16}/></Button>
                            </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </div>
      <div className="lg:col-span-1 space-y-6"><PatientPackagesWidget patientId={id!} /></div>
    </div>
  );
}