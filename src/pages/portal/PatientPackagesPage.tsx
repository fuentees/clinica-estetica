import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Package, CalendarPlus, 
  Loader2, Zap, ChevronRight 
} from "lucide-react";

// ✅ AGORA ESTES IMPORTS VÃO FUNCIONAR
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export function PatientPackagesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    professional_id: ""
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('patients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!profile) return;

      const { data: packs } = await supabase
        .from('patient_packages')
        .select(`
            *,
            treatment:treatments(id, name, duration)
        `)
        .eq('patient_id', profile.id)
        .eq('status', 'active');
      
      setPackages(packs || []);

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'profissional');
      
      setProfessionals(profs || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const openBookingModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setBookingData({ date: "", time: "", professional_id: "" });
    setIsModalOpen(true);
  };

  const handleBookSession = async () => {
    if (!bookingData.date || !bookingData.time || !bookingData.professional_id) {
        toast.error("Preencha todos os campos.");
        return;
    }

    setBookingLoading(true);
    try {
        const startDateTime = `${bookingData.date}T${bookingData.time}:00`;
        const duration = selectedPackage.treatment?.duration || 60;
        const endDate = new Date(new Date(startDateTime).getTime() + duration * 60000);

        const { error } = await supabase.from('appointments').insert({
            patient_id: selectedPackage.patient_id,
            professional_id: bookingData.professional_id,
            treatment_id: selectedPackage.treatment_id,
            start_time: startDateTime,
            end_time: endDate.toISOString(),
            status: 'scheduled',
            notes: `Sessão agendada pelo Portal (Pacote: ${selectedPackage.title})`
        });

        if (error) throw error;

        toast.success("Sessão agendada com sucesso!");
        setIsModalOpen(false);
        navigate("/portal/agendamentos"); 

    } catch (error) {
        console.error(error);
        toast.error("Erro ao agendar. Tente novamente.");
    } finally {
        setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-pink-600" size={32}/>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando pacotes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600">
            <Package size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                Meus Pacotes
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gerencie suas sessões contratadas</p>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] p-10 text-center">
             <Package size={40} className="mx-auto text-gray-300 mb-4"/>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum pacote ativo.</p>
             <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                Adquira nossos protocolos exclusivos diretamente na recepção ou pelo WhatsApp.
             </p>
             <a 
                href="https://wa.me/5511999999999" 
                target="_blank"
                className="inline-flex items-center gap-2 mt-6 text-pink-600 font-black uppercase text-xs tracking-widest hover:underline"
             >
                Ver Tratamentos Disponíveis <ChevronRight size={14}/>
             </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => {
                const progress = Math.round((pkg.used_sessions / pkg.total_sessions) * 100);
                const isCompleted = progress >= 100;
                
                return (
                    <div key={pkg.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <Package size={100} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                    {isCompleted ? "Concluído" : "Em Andamento"}
                                </span>
                                <Zap size={20} className="text-yellow-400 fill-current"/>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-1">
                                {pkg.title}
                            </h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                                {pkg.treatment?.name || "Protocolo Personalizado"}
                            </p>

                            <div className="space-y-2 mb-8">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <span>Consumido</span>
                                    <span>{pkg.used_sessions} / {pkg.total_sessions}</span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <Button 
                                onClick={() => openBookingModal(pkg)}
                                disabled={isCompleted}
                                className="w-full h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <CalendarPlus size={16}/> Agendar Sessão
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* MODAL DE AGENDAMENTO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm p-8">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-center">
                    Agendar Sessão
                </DialogTitle>
                <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {selectedPackage?.title}
                </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profissional</label>
                    {/* ✅ CORREÇÃO AQUI: Tipagem do parâmetro 'val' */}
                    <Select onValueChange={(val: string) => setBookingData({...bookingData, professional_id: val})}>
                        <SelectTrigger className="h-12 rounded-xl font-bold">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {professionals.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
                        <Input 
                            type="date" 
                            className="h-12 rounded-xl font-bold"
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
                        <Input 
                            type="time" 
                            className="h-12 rounded-xl font-bold"
                            onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <Button 
                onClick={handleBookSession} 
                disabled={bookingLoading}
                className="w-full h-14 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black uppercase tracking-widest shadow-xl"
            >
                {bookingLoading ? <Loader2 className="animate-spin"/> : "Confirmar Agendamento"}
            </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}