import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  Camera, Upload, Trash2, Loader2, Image as ImageIcon, 
  Maximize2, Sparkles, Filter, X, ArrowRightLeft, Calendar 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";

interface GalleryPhoto {
    id: string;
    url: string;
    created_at: string;
    source: 'gallery' | 'evolution'; // Para saber de onde veio
}

export function PatientGalleryPage() {
  const { id } = useParams();
  
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
        setLoading(true);
        
        // 1. Busca fotos da Galeria (Tabela patient_photos)
        const { data: galleryData } = await supabase
            .from("patient_photos")
            .select("id, url, created_at")
            .eq("patient_id", id);

        // 2. Busca fotos das Evoluções (JSON em evolution_records)
        const { data: evolutionData } = await supabase
            .from("evolution_records")
            .select("id, created_at, attachments")
            .eq("patient_id", id);

        const allPhotos: GalleryPhoto[] = [];

        // Processa Galeria
        if (galleryData) {
            galleryData.forEach(p => {
                allPhotos.push({ ...p, source: 'gallery' });
            });
        }

        // Processa Evoluções (Extrai URLs do JSON)
        if (evolutionData) {
            evolutionData.forEach(record => {
                if (record.attachments && record.attachments.photos && Array.isArray(record.attachments.photos)) {
                    record.attachments.photos.forEach((photoUrl: string) => {
                        allPhotos.push({
                            id: record.id, // Usa ID da evolução como referência
                            url: photoUrl,
                            created_at: record.created_at,
                            source: 'evolution'
                        });
                    });
                }
            });
        }

        // Ordena por data (mais antigas primeiro para timeline visual)
        allPhotos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        setPhotos(allPhotos);
    } catch (error) { 
        console.error("Erro ao carregar galeria:", error); 
    } finally { 
        setLoading(false); 
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files?.length) return;
     
     setUploading(true);
     const file = e.target.files[0];
     const fileName = `${id}/${Date.now()}_${Math.random().toString(36).substring(7)}`; 
     
     try {
         const { error: uploadError } = await supabase.storage.from('patient-photos').upload(fileName, file);
         if (uploadError) throw uploadError;
         
         const { data } = supabase.storage.from('patient-photos').getPublicUrl(fileName);
         const publicUrl = data.publicUrl;
         
         const { data: newPhoto, error: dbError } = await supabase
           .from("patient_photos")
           .insert({
               patient_id: id,
               url: publicUrl
           })
           .select()
           .single();

         if (dbError) throw dbError;
         
         setPhotos(prev => [...prev, { ...newPhoto, source: 'gallery' }]);
         toast.success("Foto salva!");
     } catch (err: any) { 
         console.error(err);
         toast.error("Erro ao salvar: " + err.message); 
     } finally { 
         setUploading(false);
         if (fileInputRef.current) fileInputRef.current.value = "";
     }
  }

  const handleDelete = async (photoId: string, urlToDelete: string, source: 'gallery' | 'evolution') => {
      if (source === 'evolution') {
          toast.error("Fotos de evolução devem ser apagadas no Prontuário.");
          return;
      }

      if(!confirm("Apagar esta foto da galeria?")) return;
      
      try {
          const { error } = await supabase.from("patient_photos").delete().eq("id", photoId);
          if (error) throw error;

          setPhotos(prev => prev.filter(p => p.id !== photoId));
          setCompareSelection(prev => prev.filter(url => url !== urlToDelete));
          toast.success("Foto excluída.");
      } catch (error: any) {
          toast.error("Erro ao excluir.");
      }
  }

  const toggleCompare = (url: string) => {
    if (compareSelection.includes(url)) {
        setCompareSelection(prev => prev.filter(p => p !== url));
    } else {
        if (compareSelection.length >= 2) {
            toast.error("Selecione apenas 2 fotos para comparar.");
            return;
        }
        setCompareSelection(prev => [...prev, url]);
    }
  }

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR');
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-pink-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Carregando Galeria...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-3xl text-pink-600">
                    <Camera size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
                        Timeline <span className="text-pink-600">Visual</span>
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
                        {photos.length} Fotos (Galeria + Prontuário)
                    </p>
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
                    Nova Foto Avulsa
                </Button>
            </div>
        </div>

        {/* COMPARATIVO ANTES E DEPOIS */}
        {photos.length >= 2 && (
            <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 relative group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Sparkles size={180}/>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-pink-600 rounded-full"></div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                                {compareSelection.length === 2 ? "Comparação Manual" : "Evolução Total"}
                            </h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                {compareSelection.length === 2 ? "Visualizando seleção personalizada" : "Início vs. Fim"}
                            </p>
                        </div>
                    </div>
                    {compareSelection.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setCompareSelection([])} className="text-xs uppercase font-bold text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">
                            <X size={14} className="mr-2"/> Limpar Seleção
                        </Button>
                    )}
                </div>

                <div className="max-w-lg mx-auto w-full h-[600px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-gray-900 animate-in zoom-in-95 duration-700 bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
                    <BeforeAfterSlider 
                        beforeImage={compareSelection.length === 2 ? compareSelection[0] : photos[0].url} 
                        afterImage={compareSelection.length === 2 ? compareSelection[1] : photos[photos.length - 1].url} 
                        beforeLabel={compareSelection.length === 2 ? "Foto A" : "Inicial"} 
                        afterLabel={compareSelection.length === 2 ? "Foto B" : "Atual"} 
                    />
                </div>

                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-700">
                        <Filter size={14} className="text-pink-500"/>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arraste a barra central</span>
                    </div>
                </div>
            </div>
        )}

        {/* GRADE DE FOTOS */}
        {photos.length === 0 ? (
            <div className="text-center py-40 bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
                    <ImageIcon size={48} />
                </div>
                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Galeria Vazia</h3>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* Mostra as mais recentes primeiro na grade */}
                {photos.slice().reverse().map((photo, i) => {
                    const isSelected = compareSelection.includes(photo.url);
                    const isEvolution = photo.source === 'evolution';
                    
                    return (
                        <div 
                            key={`${photo.id}-${i}`} 
                            className={`group relative aspect-[3/4] rounded-[2rem] overflow-hidden border-4 shadow-lg bg-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer
                                ${isSelected ? 'border-pink-500 ring-4 ring-pink-500/20 z-10 scale-105' : 'border-white dark:border-gray-800'}
                            `}
                            onClick={() => setViewingPhoto(photo.url)} 
                        >
                            <img 
                                src={photo.url} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt={`Foto ${i}`} 
                            />
                            
                            {/* Badge de Origem */}
                            {isEvolution && (
                                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg">
                                    Prontuário
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 md:p-6"
                                 onClick={(e) => e.stopPropagation()} 
                            >
                                <div className="flex items-center justify-center gap-3 mb-4">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleCompare(photo.url); }}
                                        className={`p-3 rounded-full backdrop-blur-md transition-all hover:scale-110 ${isSelected ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-white/20 hover:bg-white/40 text-white'}`}
                                        title="Comparar"
                                     >
                                        <ArrowRightLeft size={18}/>
                                     </button>

                                     {/* Só permite excluir se for da galeria (não evolução) */}
                                     {!isEvolution && (
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.url, photo.source); }} 
                                            className="p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all hover:scale-110 hover:shadow-lg hover:shadow-red-600/30"
                                            title="Excluir"
                                         >
                                            <Trash2 size={18}/>
                                         </button>
                                     )}
                                </div>
                                
                                <div className="text-center">
                                    <span className="text-[10px] font-mono text-white/70 block mb-1">
                                        <Calendar size={10} className="inline mr-1"/> {formatDate(photo.created_at)}
                                    </span>
                                </div>
                            </div>
                            
                            {isSelected && (
                                <div className="absolute top-4 right-4 bg-pink-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in fade-in zoom-in">
                                    <Sparkles size={10}/> Comparando
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {/* LIGHTBOX (ZOOM) */}
        {viewingPhoto && (
            <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                <button 
                    onClick={() => setViewingPhoto(null)}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                >
                    <X size={24} />
                </button>
                <img 
                    src={viewingPhoto} 
                    className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" 
                    alt="Zoom" 
                />
            </div>
        )}
    </div>
  );
}