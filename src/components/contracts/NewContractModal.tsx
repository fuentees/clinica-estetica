import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button'; // Caminho corrigido
import { Input } from '../../components/ui/input';   // Caminho corrigido

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clinic_id: string;
}

export function NewContractModal({ isOpen, onClose, onSuccess, clinicId }: NewContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    contractType: 'consentimento',
  });

  // Busca pacientes
  useEffect(() => {
    if (isOpen && clinicId) {
      const fetchPatients = async () => {
        const { data } = await supabase
          .from('patients')
          .select('id, name')
          .eq('clinic_id', clinicId)
          .order('name');
        setPatients(data || []);
      };
      fetchPatients();
    }
  }, [isOpen, clinicId]);

  const handleSave = async () => {
    if (!formData.patientId || !formData.title) {
      toast.error('Preencha o paciente e o título.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('digital_contracts').insert({
        clinicId,
        patient_id: formData.patientId,
        title: formData.title,
        contract_type: formData.contractType,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Contrato criado com sucesso!');
      onSuccess();
      onClose();
      setFormData({ patient_id: '', title: '', contractType: 'consentimento' });
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao criar contrato.');
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
            <FileText className="text-blue-600" size={24} />
            Novo Contrato
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Paciente</label>
            <select
              className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.patientId}
              // Tipagem explícita do evento corrigida aqui
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, patient_id: e.target.value })}
            >
              <option value="">Selecione um paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Título do Contrato</label>
            <Input 
              placeholder="Ex: Termo de Consentimento - Botox"
              value={formData.title}
              // Tipagem explícita corrigida
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Tipo de Documento</label>
            <select
              className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.contractType}
              // Tipagem explícita corrigida
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, contractType: e.target.value })}
            >
              <option value="consentimento">Termo de Consentimento</option>
              <option value="contrato_servico">Contrato de Prestação de Serviço</option>
              <option value="anamnese">Anamnese Assinada</option>
              <option value="uso_imagem">Direito de Uso de Imagem</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Criar Contrato
          </Button>
        </div>

      </div>
    </div>
  );
}