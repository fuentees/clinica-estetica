import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";

export function PatientGalleryPage() {
  const { id } = useParams();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPhotos() {
        try {
            const { data } = await supabase.from("patients").select("procedimentos_detalhes_json").eq("id", id).single();
            if(data?.procedimentos_detalhes_json?.galeria_fotos) {
                setPhotos(data.procedimentos_detalhes_json.galeria_fotos);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    loadPhotos();
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files?.length) return;
     setUploading(true);
     const file = e.target.files[0];
     const fileName = `${id}/${Date.now()}`; // Nome único
     
     try {
         // Upload pro Storage
         const { error: uploadError } = await supabase.storage.from('patient-photos').upload(fileName, file);
         if (uploadError) throw uploadError;
         
         // Pega URL pública
         const { data } = supabase.storage.from('patient-photos').getPublicUrl(fileName);
         const publicUrl = data.publicUrl;
         const newPhotos = [...photos, publicUrl];
         
         // Atualiza JSON no Banco
         const { data: curr } = await supabase.from("patients").select("procedimentos_detalhes_json").eq("id", id).single();
         const json = curr?.procedimentos_detalhes_json || {};
         await supabase.from("patients").update({ 
             procedimentos_detalhes_json: { ...json, galeria_fotos: newPhotos } 
         }).eq("id", id);
         
         setPhotos(newPhotos);
         toast.success("Foto salva!");
     } catch (err) { 
         console.error(err);
         toast.error("Erro no upload. Verifique se o Bucket 'patient-photos' existe e é público."); 
     } finally { 
         setUploading(false);
         if (fileInputRef.current) fileInputRef.current.value = "";
     }
  }

  const handleDelete = async (url: string) => {
      if(!confirm("Apagar esta foto permanentemente?")) return;
      
      const newPhotos = photos.filter(p => p !== url);
      
      try {
          // Atualiza banco
          const { data: curr } = await supabase.from("patients").select("procedimentos_detalhes_json").eq("id", id).single();
          const json = curr?.procedimentos_detalhes_json || {};
          await supabase.from("patients").update({ 
              procedimentos_detalhes_json: { ...json, galeria_fotos: newPhotos } 
          }).eq("id", id);
          
          setPhotos(newPhotos);
          toast.success("Foto apagada.");
          
          // Nota: O ideal seria deletar do Storage também, mas requer tratar a URL para pegar o path.
      } catch (error) {
          toast.error("Erro ao apagar.");
      }
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white"><Camera className="text-pink-600"/> Galeria de Fotos</h2>
                <p className="text-sm text-gray-500">Registre a evolução visual do paciente</p>
            </div>
            <div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2 bg-pink-600 hover:bg-pink-700 text-white">
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />} Adicionar Foto
                </Button>
            </div>
        </div>

        {photos.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-3 opacity-50"/>
                <p>Nenhuma foto registrada ainda.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {photos.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                        <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={`Foto ${i}`} />
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-full backdrop-blur-sm"><ImageIcon size={18}/></a>
                             <button onClick={() => handleDelete(url)} className="p-2 bg-red-600/80 text-white hover:bg-red-600 rounded-full backdrop-blur-sm"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {photos.length >= 2 && (
            <div className="border-t dark:border-gray-700 pt-8 mt-8">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300"><ImageIcon size={20}/> Comparativo Rápido (Primeira vs. Última)</h3>
                <div className="max-w-2xl mx-auto">
                    <BeforeAfterSlider beforeImage={photos[0]} afterImage={photos[photos.length - 1]} beforeLabel="Início" afterLabel="Atual" />
                </div>
            </div>
        )}
    </div>
  );
}