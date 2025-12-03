import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Caminho corrigido para src/lib/supabase
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  folder?: string;
}

export function ImageUpload({ onUpload, label = "Enviar Foto", folder = "geral" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      // Gera nome único para evitar substituição
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('photos') // IMPORTANTE: Seu bucket no Supabase deve se chamar 'photos'
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Pegar Link Público
      const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      setPreview(data.publicUrl);
      onUpload(data.publicUrl);
      toast.success('Upload ok!');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setPreview(null);
    onUpload('');
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      {!preview ? (
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-pink-500 transition-colors cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-600">
          <div className="space-y-1 text-center w-full">
            {uploading ? (
              <Loader2 className="mx-auto h-12 w-12 text-pink-500 animate-spin" />
            ) : (
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
              <label className="relative cursor-pointer rounded-md font-medium text-pink-600 hover:text-pink-500">
                <span>{uploading ? 'Enviando...' : 'Clique para enviar'}</span>
                <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group mt-2 h-48 w-full">
          <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg border border-gray-200" />
          <button
            onClick={clearImage}
            type="button"
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}