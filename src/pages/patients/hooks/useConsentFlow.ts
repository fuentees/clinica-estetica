import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-hot-toast";

interface Template { 
  id: string; 
  title: string; 
  content: string; 
  procedure_keywords: string[]; 
}

// ✅ Status estendidos para cobrir todo o fluxo jurídico
export type ConsentStatus = 'none' | 'pending' | 'signed' | 'completed';

export function useConsentFlow(
  clinicId: string | null, 
  patientId: string | undefined, 
  professionalId: string | null,
  professionalName: string,
  patientName: string
) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [status, setStatus] = useState<ConsentStatus>('none');
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [parsedText, setParsedText] = useState("");
  const [clinicName, setClinicName] = useState("Carregando...");

  // 1. Carregar Configurações Iniciais (Templates e Nome da Clínica)
  useEffect(() => {
    if (!clinicId) return;
    const fetchConfig = async () => {
      const { data: temps } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('deleted_at', null);
      
      setTemplates(temps || []);

      const { data: clinic } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', clinicId)
        .single();
      
      if (clinic) setClinicName(clinic.name);
    };
    fetchConfig();
  }, [clinicId]);

  // 2. Verificar Gatilho e PERSISTÊNCIA do Status Jurídico
  const checkConsentRequirement = async (procedureName: string) => {
    if (!procedureName || !patientId) { 
      setStatus('none'); 
      setPendingTemplate(null);
      return; 
    }

    // Busca se esse procedimento exige termo (via keywords)
    const match = templates.find(t => 
      t.procedure_keywords?.some(k => procedureName.toLowerCase().includes(k.toLowerCase()))
    );

    if (!match) { 
      setPendingTemplate(null); 
      setStatus('none'); 
      return; 
    }

    setPendingTemplate(match);

    // 🔍 BUSCA NO BANCO O STATUS REAL E ATUAL
    // Pegamos o registro mais recente para evitar conflitos
    const { data: existingConsent, error } = await supabase
      .from('patient_consents')
      .select('status')
      .eq('patient_id', patientId)
      .eq('procedure_name', procedureName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConsent) {
      // Se já existe no banco (pending, signed ou completed), assume esse status
      setStatus(existingConsent.status as ConsentStatus);
      console.log(`⚖️ Status Jurídico Persistente: ${existingConsent.status}`);
    } else {
      // Se não existe registro, mas o procedimento exige, o status é pending
      setStatus('pending');
    }
  };

  // 3. Preparar e Abrir Modal
  const openModal = () => {
    if (!pendingTemplate) return;
    
    // Processamento de variáveis do template para visualização
    const text = pendingTemplate.content
      .replace(/{PACIENTE_NOME}/g, (patientName || "").toUpperCase())
      .replace(/{PACIENTE_CPF}/g, "___.___.___-__")
      .replace(/{PROFISSIONAL_NOME}/g, (professionalName || "").toUpperCase())
      .replace(/{DATA_ATUAL}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{CLINICA_NOME}/g, clinicName.toUpperCase());
    
    setParsedText(text);
    setModalOpen(true);
  };

  // 4. Confirmar Assinatura (Legado / Fallback)
  const confirmSignature = async (procedureName: string, userAgent: string) => {
    if (!pendingTemplate || !clinicId || !patientId || !professionalId) return false;
    try {
      const { error } = await supabase.from('patient_consents').insert({
        clinic_id: clinicId,
        patient_id: patientId,
        professional_id: professionalId,
        procedure_name: procedureName,
        content_snapshot: parsedText,
        status: 'signed' // Marcamos como assinado
      });

      if (error) throw error;
      
      toast.success("Termo registrado!");
      setStatus('signed');
      setModalOpen(false);
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar documento jurídico.");
      return false;
    }
  };

  return {
    templates,
    status,
    setStatus, 
    pendingTemplate,
    modalOpen,
    setModalOpen,
    parsedText,
    checkConsentRequirement,
    openModal,
    confirmSignature
  };
}