import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon, Maximize2, Sparkles, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";

export function PatientGalleryPage() {
  const { id } = useParams();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Identificar Clínica
            const { data: profile } = await supabase.from('profiles').select('clinicId').eq('id', user.id).single();
            if (profile) setClinicId(profile.clinicId);

            // 2. Carregar Fotos do Tratamento Ativo
            // Ajuste: patientId (camelCase)
            const { data } = await supabase
                .from("patient_treatments")
                .select("photos")
                .eq("patientId", id)
                .eq("status", "active")
                .limit(1)
                .single();

            if (data?.photos) {
                setPhotos(data.photos);
            }
        } catch (error) { 
            console.error("Erro ao carregar galeria:", error); 
        } finally { 
            setLoading(false); 
        }
    }
    loadData();
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files?.length || !clinicId) {
         if(!clinicId) toast.error("Erro de identificação da clínica.");
         return;
     }
     
     setUploading(true);
     const file = e.target.files[0];
     const fileName = `${id}/${Date.now()}_${Math.random().toString(36).substring(7)}`; 
     
     try {
         // 1. Upload para o Storage
         const { error: uploadError } = await supabase.storage.from('patient-photos').upload(fileName, file);
         if (uploadError) throw uploadError;
         
         // 2. Resgatar URL pública
         const { data } = supabase.storage.from('patient-photos').getPublicUrl(fileName);
         const publicUrl = data.publicUrl;
         const newPhotos = [...photos, publicUrl];
         
         // 3. Atualizar ou Criar Registro de Tratamento
         // Primeiro, verifica se já existe um tratamento ativo
         const { data: existing } = await supabase
            .from("patient_treatments")
            .select("id")
            .eq("patientId", id)
            .eq("status", "active")
            .single();

         if (existing) {
             // Atualiza existente
             await supabase
                .from("patient_treatments")
                .update({ photos: newPhotos })
                .eq("id", existing.id);
         } else {
             // Cria novo tratamento (Galeria Inicial)
             await supabase.from("patient_treatments").insert({
                 clinicId: clinicId,
                 patientId: id,
                 status: "active",
                 notes: "Galeria de Fotos",
                 photos: newPhotos,
                 startDate: new Date().toISOString()
             });
         }
         
         setPhotos(newPhotos);
         toast.success("Imagem anexada à timeline!");
     } catch (err: any) { 
         console.error(err);
         toast.error("Falha no upload: " + err.message); 
     } finally { 
         setUploading(false);
         if (fileInputRef.current) fileInputRef.current.value = "";
     }
  }

  const handleDelete = async (url: string) => {
      if(!confirm("Deseja remover esta imagem permanentemente do prontuário?")) return;
      
      const newPhotos = photos.filter(p => p !== url);
      
      try {
          const { data: existing } = await supabase
            .from("patient_treatments")
            .select("id")
            .eq("patientId", id)
            .eq("status", "active")
            .single();

          if (existing) {
              await supabase
                .from("patient_treatments")
                .update({ photos: newPhotos })
                .eq("id", existing.id);
              
              setPhotos(newPhotos);
              toast.success("Foto removida.");
          }
      } catch (error) {
          toast.error("Erro ao sincronizar exclusão.");
      }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-pink-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Revelando Galeria...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
        
        {/* HEADER DA GALERIA */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-3xl text-pink-600">
                    <Camera size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
                        Timeline <span className="text-pink-600">Visual</span>
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Evolução fotográfica e comparativos de resultados</p>
                </div>
            </div>
            
            <div className="flex gap-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploading} 
                    className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload size={18} className="mr-2 text-pink-500" />} 
                    Capturar Nova Foto
                </Button>
            </div>
        </div>

        {/* GRADE DE FOTOS */}
        {photos.length === 0 ? (
            <div className="text-center py-40 bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
                    <ImageIcon size={48} />
                </div>
                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Sem registros visuais</h3>
                <p className="text-gray-400 text-xs mt-2">Clique em capturar para iniciar a timeline de resultados.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {photos.slice().reverse().map((url, i) => (
                    <div key={i} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                        <img 
                            src={url} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            alt={`Evolução ${i}`} 
                        />
                        
                        {/* Overlay de Ações */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                            <div className="flex items-center justify-between gap-2">
                                 <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-2xl backdrop-blur-md transition-colors"
                                    title="Ver em tamanho real"
                                 >
                                    <Maximize2 size={20}/>
                                 </a>
                                 <button 
                                    onClick={() => handleDelete(url)} 
                                    className="p-3 bg-rose-600/80 hover:bg-rose-600 text-white rounded-2xl backdrop-blur-md transition-colors"
                                    title="Excluir do prontuário"
                                 >
                                    <Trash2 size={20}/>
                                 </button>
                            </div>
                        </div>
                        
                        {/* Tag de Data (Simulada para Demo) */}
                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="text-[9px] font-bold text-white uppercase">Sessão {photos.length - i}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* COMPARATIVO ANTES E DEPOIS (Visualização de Poder) */}
        {photos.length >= 2 && (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Sparkles size={180}/>
                </div>
                
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-8 bg-pink-600 rounded-full"></div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Comparativo de Resultados</h3>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Análise dinâmica entre a primeira e a última foto registrada</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-50 dark:border-gray-900 animate-in zoom-in-95 duration-700">
                    <BeforeAfterSlider 
                        beforeImage={photos[0]} 
                        afterImage={photos[photos.length - 1]} 
                        beforeLabel="Status Inicial" 
                        afterLabel="Resultado Atual" 
                    />
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-700">
                        <Filter size={14} className="text-pink-500"/>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arraste a barra para comparar</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}