import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Clock, Loader2, Activity, Sparkles, Pencil, 
  Lock, X, PlusCircle, Play, Package, CheckCircle2, UserX, Check
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';

// --- FUNÇÕES DE APOIO ---
const getTodayDateStr = () => format(new Date(), 'yyyy-MM-dd');

const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "--/--";
    const today = getTodayDateStr();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = format(d, 'yyyy-MM-dd');
    if (dateStr === today) return "Hoje";
    if (dateStr === tomorrow) return "Amanhã";
    const dateParts = dateStr.split('-');
    const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]), 12, 0, 0);
    return format(dateObj, 'dd/MM/yyyy');
};

const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? '--:--' : format(date, 'HH:mm');
};

export default function ProfessionalOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  
  const [stats, setStats] = useState({
    todayTotal: 0,
    completedToday: 0,
    next: null as any,
    nextKit: [] as any[]
  });
  
  const [todayList, setTodayList] = useState<any[]>([]);

  async function loadDashboard() {
    if (!id) return;
    try {
      setLoading(true);
      const todayStr = getTodayDateStr(); 
      const now = new Date(); 

      const { data: todays } = await supabase.from('appointments')
          .select(`
            id, start_time, status, notes, room, service_id,
            patient:patients!patient_id(id, name), 
            service:services!service_id(name, duration)
          `)
          .eq('professional_id', id)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .neq('status', 'canceled')
          .order('start_time');

      const nextAppt = (todays || []).find(a => new Date(a.start_time) >= now && a.status === 'scheduled') || null;
      
      let kitData: any[] = [];
      if (nextAppt?.service_id) {
          const { data: kit } = await supabase
            .from('procedure_items')
            .select('quantity_needed, inventory(name)')
            .eq('procedure_id', nextAppt.service_id);
          kitData = kit || [];
      }

      setTodayList(todays || []);
      setStats({
        todayTotal: todays?.length || 0,
        completedToday: todays?.filter(a => a.status === 'completed').length || 0,
        next: nextAppt,
        nextKit: kitData
      });

    } catch (error) { 
      console.error("Erro Dashboard:", error); 
      toast.error("Erro ao carregar agenda.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDashboard(); }, [id]);

  const handleUpdateStatus = async (e: React.MouseEvent, apptId: string, newStatus: string) => {
      e.stopPropagation();
      try {
          const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apptId);
          if (error) throw error;
          toast.success(`Status: ${newStatus.toUpperCase()}`);
          loadDashboard();
      } catch (error) { toast.error("Erro ao atualizar status."); }
  };

  const filteredList = todayList.filter(appt => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return appt.status === 'scheduled' || appt.status === 'confirmed';
    if (filterStatus === 'completed') return appt.status === 'completed';
    return true;
  });

  if (loading) return <div className="p-10 flex justify-center h-96 items-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {isBlockModalOpen && (
        <BlockScheduleModal professionalId={id!} onClose={() => setIsBlockModalOpen(false)} onSuccess={() => { setIsBlockModalOpen(false); loadDashboard(); }} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD PRÓXIMO PACIENTE (LOGÍSTICA) */}
        <div className="lg:col-span-2 relative overflow-hidden p-8 rounded-[2.5rem] bg-gray-900 text-white shadow-2xl border border-white/5 min-h-[400px] flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-blue-900/40 opacity-50"></div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 h-full">
                
                <div className="flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-pink-500/20 p-2 rounded-xl border border-pink-500/30"><Clock size={18} className="text-pink-400"/></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">Foco do Momento</span>
                        </div>
                        {stats.next ? (
                            <>
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-tight mb-2 truncate">
                                    {stats.next.patient?.name}
                                </h2>
                                <p className="text-gray-400 font-bold uppercase text-xs flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400"/> {stats.next.service?.name}
                                </p>
                                <div className="mt-6 flex items-center gap-4 text-sm font-black italic text-pink-500">
                                    <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest text-[10px]">
                                        {formatTime(stats.next.start_time)}
                                    </span>
                                    <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">
                                        SALA: {stats.next.room || '---'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 font-black uppercase text-xs mt-10">Nenhum pendente agora</p>
                        )}
                    </div>
                    {stats.next && (
                        <Button onClick={() => navigate(`/patients/${stats.next.patient?.id}/evolution`)} className="w-full h-16 bg-pink-600 hover:bg-pink-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl mt-8">
                            <Play size={16} className="mr-2 fill-current"/> Prontuário & Iniciar
                        </Button>
                    )}
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Package size={16} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Kit de Bancada</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                        {stats.nextKit.length > 0 ? stats.nextKit.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-[10px] font-bold text-gray-300 uppercase truncate pr-2">{item.inventory?.name}</span>
                                <span className="text-[10px] font-black text-pink-500">{item.quantity_needed}</span>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <Package size={32} />
                                <p className="text-[8px] font-black uppercase mt-2 italic">Sem materiais vinculados</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* ATALHOS LATERAIS */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Status Operacional</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-2xl font-black italic text-gray-900">{stats.todayTotal}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase">Hoje</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                        <p className="text-2xl font-black italic text-emerald-600">{stats.completedToday}</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase">Feitos</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ToolButton icon={<Calendar size={20}/>} label="Agenda" onClick={() => navigate(`agenda`)} color="blue"/>
                <ToolButton icon={<Lock size={20}/>} label="Bloquear" onClick={() => setIsBlockModalOpen(true)} color="orange"/>
            </div>
            <Button onClick={() => navigate('/appointments/new')} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg">
                <PlusCircle size={18} className="mr-2" /> Novo Agendamento
            </Button>
        </div>
      </div>

      {/* CRONOGRAMA COM ABAS DE FILTRO */}
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 mt-8 overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic flex items-center gap-3"><Activity size={22} className="text-pink-600"/> Cronograma do Dia</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{formatFriendlyDate(getTodayDateStr())}</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
                    <button onClick={() => setFilterStatus('pending')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filterStatus === 'pending' ? 'bg-white shadow-md text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>Pendentes</button>
                    <button onClick={() => setFilterStatus('completed')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filterStatus === 'completed' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>Concluídos</button>
                    <button onClick={() => setFilterStatus('all')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filterStatus === 'all' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>Todos</button>
                </div>
          </div>

          <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
              {filteredList.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center opacity-20">
                      <Calendar size={48} />
                      <p className="text-xs font-black uppercase tracking-widest mt-4 italic">Nenhum atendimento nesta categoria</p>
                  </div>
              ) : filteredList.map(appt => (
                  <div key={appt.id} className={`group flex items-center gap-6 p-6 rounded-[2rem] border transition-all ${appt.status === 'blocked' ? 'bg-gray-50/50 opacity-60 border-dashed' : 'bg-white hover:border-pink-200 hover:shadow-xl'}`}>
                      <div className={`p-4 rounded-2xl min-w-[90px] text-center border-2 ${appt.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-900'}`}>
                          <span className="block text-xl font-black italic">{formatTime(appt.start_time)}</span> 
                      </div>
                      
                      <div className="flex-1">
                          <h4 className="font-black text-lg italic uppercase text-gray-900 truncate">
                              {appt.status === 'blocked' ? 'Horário Bloqueado' : appt.patient?.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{appt.service?.name || '---'}</p>
                            {appt.room && <span className="text-[9px] font-black text-blue-500 uppercase">Sala: {appt.room}</span>}
                          </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {appt.status === 'scheduled' || appt.status === 'confirmed' ? (
                            <>
                                <Button size="sm" variant="outline" onClick={(e) => handleUpdateStatus(e, appt.id, 'confirmed')} className={`h-11 w-11 p-0 rounded-2xl border-purple-100 text-purple-600 ${appt.status === 'confirmed' ? 'bg-purple-600 text-white border-none' : 'hover:bg-purple-50'}`}><Check size={18}/></Button>
                                <Button size="sm" variant="outline" onClick={(e) => handleUpdateStatus(e, appt.id, 'completed')} className="h-11 px-6 rounded-2xl font-black uppercase text-[9px] tracking-widest text-emerald-600 border-emerald-100 hover:bg-emerald-50"><CheckCircle2 size={16} className="mr-2"/> Finalizar</Button>
                                <Button size="sm" variant="outline" onClick={(e) => handleUpdateStatus(e, appt.id, 'no_show')} className="h-11 w-11 p-0 rounded-2xl text-gray-300 border-gray-200 hover:text-gray-500"><UserX size={18}/></Button>
                            </>
                        ) : (
                            <span className={`text-[8px] font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                {appt.status === 'completed' ? 'Finalizado' : appt.status}
                            </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/appointments/${appt.id}/edit`)} className="rounded-xl h-11 w-11 text-gray-200 hover:text-pink-600 transition-colors"><Pencil size={18}/></Button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

// --- MODAIS E BOTÕES ---

function ToolButton({ icon, label, onClick, color }: any) {
    const colors: any = { blue: 'text-blue-500 border-blue-50 hover:bg-blue-50', orange: 'text-orange-500 border-orange-50 hover:bg-orange-50' };
    return (
        <Button variant="outline" onClick={onClick} className={`bg-white border-2 rounded-2xl h-auto py-5 px-4 flex-1 flex flex-col gap-2 transition-all hover:scale-105 shadow-sm ${colors[color]}`}>
            <div className="p-2.5 rounded-xl bg-gray-50">{icon}</div> 
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </Button>
    )
}

function BlockScheduleModal({ professionalId, onClose, onSuccess }: any) {
    const [l, setL] = useState(false);
    const [f, setF] = useState({ date: new Date().toISOString().split('T')[0], start: "", end: "", reason: "" });
    const save = async () => {
        if(!f.start || !f.end || !f.reason) return toast.error("Preencha tudo!");
        setL(true);
        const { error } = await supabase.from('appointments').insert({ professional_id: professionalId, start_time: `${f.date}T${f.start}:00`, end_time: `${f.date}T${f.end}:00`, status: 'blocked', notes: `BLOQUEIO: ${f.reason}` });
        if(error) toast.error("Erro ao bloquear");
        else { toast.success("Bloqueado!"); onSuccess(); }
        setL(false);
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] p-10 relative border border-gray-100 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b pb-6">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Bloquear <span className="text-orange-500">Agenda</span></h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20}/></button>
                </div>
                <div className="space-y-5">
                    <input type="date" value={f.date} onChange={e=>setF({...f, date:e.target.value})} className="w-full h-12 p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="time" value={f.start} onChange={e=>setF({...f, start:e.target.value})} className="w-full h-12 p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none"/>
                        <input type="time" value={f.end} onChange={e=>setF({...f, end:e.target.value})} className="w-full h-12 p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none"/>
                    </div>
                    <input type="text" placeholder="Motivo..." value={f.reason} onChange={e=>setF({...f, reason:e.target.value})} className="w-full h-12 p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none"/>
                    <Button onClick={save} disabled={l} className="w-full h-16 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest mt-4">
                        {l ? <Loader2 className="animate-spin"/> : "Confirmar Bloqueio"}
                    </Button>
                </div>
            </div>
        </div>
    )
}