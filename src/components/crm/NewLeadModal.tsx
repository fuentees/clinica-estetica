import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, UserPlus, Mail, Phone, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clinicId: string;
}

export function NewLeadModal({ isOpen, onClose, onSuccess, clinicId }: NewLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Instagram', // Valor padrão
  });

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Nome e Telefone são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        clinicId, // Vincula à clínica
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        status: 'new',
        score: 0,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Lead cadastrado com sucesso!');
      onSuccess();
      onClose();
      setFormData({ name: '', email: '', phone: '', source: 'Instagram' });
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao cadastrar lead.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <UserPlus className="text-blue-600" size={24} />
            Novo Lead
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Nome Completo *</label>
            <div className="relative">
                <Input 
                  placeholder="Ex: Maria Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                />
                <UserPlus size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Telefone *</label>
                <div className="relative">
                    <Input 
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                    />
                    <Phone size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Origem</label>
                <div className="relative">
                    <select
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Google">Google</option>
                      <option value="Indicação">Indicação</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Outros">Outros</option>
                    </select>
                    <Tag size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                </div>
              </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Email (Opcional)</label>
            <div className="relative">
                <Input 
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
                <Mail size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Salvar Lead
          </Button>
        </div>

      </div>
    </div>
  );
}