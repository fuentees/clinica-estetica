import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-hot-toast";

interface Template { 
  id: string; 
  title: string; 
  content: string; 
  procedure_keywords: string[]; 
}

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
  
  // Ref para evitar loops infinitos no useEffect
  const processingRef = useRef(false);

  // 1. Carregar Configurações
  useEffect(() => {
    if (!clinicId) return;
    const fetchConfig = async () => {
      // Busca templates (sem filtro de status para garantir que ache)
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

  // Função para criar o Rascunho no banco (Necessário para o QR Code funcionar)
  const ensureDraftExists = async (template: Template, procName: string) => {
      if (!patientId || !clinicId) return;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Verifica se já existe rascunho HOJE
      const { data: existing } = await supabase
        .from('patient_consents')
        .select('id')
        .eq('patient_id', patientId)
        .eq('template_id', template.id)
        .eq('status', 'pending')
        .gte('created_at', `${today}T00:00:00`)
        .maybeSingle();

      if (!existing) {
         console.log("📝 Criando rascunho para assinatura...");
         await supabase.from('patient_consents').insert({
            clinic_id: clinicId,
            patient_id: patientId,
            template_id: template.id,
            professional_id: professionalId,
            procedure_name: procName,
            content_snapshot: template.content,
            status: 'pending',
            metadata: { origin: 'auto_evolution' }
         });
      }
  };

  // 2. Verificar Gatilho (Check Principal)
  const checkConsentRequirement = async (procedureName: string) => {
    if (!procedureName || !patientId) { 
      setStatus('none'); 
      setPendingTemplate(null);
      return; 
    }

    // 🔍 Lógica Inteligente: Busca por Nome exato OU Palavra-Chave
    // Isso resolve o problema de ter que configurar keywords manualmente se o nome for igual
    const match = templates.find(t => {
        const pName = procedureName.toLowerCase();
        const tTitle = t.title.toLowerCase();
        
        // 1. Título contém o procedimento ou vice-versa (ex: "Botox" vs "Aplicação de Botox")
        if (pName.includes(tTitle) || tTitle.includes(pName)) return true;

        // 2. Keywords (se existirem)
        if (t.procedure_keywords && Array.isArray(t.procedure_keywords)) {
            return t.procedure_keywords.some(k => pName.includes(k.toLowerCase()));
        }
        return false;
    });

    if (!match) { 
      setPendingTemplate(null); 
      setStatus('none'); 
      return; 
    }

    setPendingTemplate(match);

    // Verifica status atual no banco
    const today = new Date().toISOString().split('T')[0];
    const { data: existingConsent } = await supabase
      .from('patient_consents')
      .select('status')
      .eq('patient_id', patientId)
      .eq('template_id', match.id)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConsent && existingConsent.status === 'signed') {
      setStatus('signed');
    } else {
      setStatus('pending');
      // Cria o rascunho para o QR Code funcionar
      await ensureDraftExists(match, procedureName);
    }
  };

  // ✅ 3. POLLING CORRIGIDO (O Radar sem Erro 400)
  useEffect(() => {
    // SÓ RODA SE TIVER TODOS OS DADOS. Isso impede o erro vermelho no console.
    if (status !== 'pending' || !pendingTemplate?.id || !patientId) return;

    const interval = setInterval(async () => {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('patient_consents')
            .select('status')
            .eq('patient_id', patientId)
            .eq('template_id', pendingTemplate.id) // Agora garantimos que existe
            .gte('created_at', `${today}T00:00:00`)
            .eq('status', 'signed') 
            .maybeSingle();

        if (!error && data) {
            setStatus('signed');
            toast.success("Assinatura confirmada!", { duration: 4000 });
            setModalOpen(false);
            clearInterval(interval);
        }
    }, 3000); 

    return () => clearInterval(interval);
  }, [status, pendingTemplate, patientId]); // Dependências corrigidas

  // 4. Modal e Helpers
  const openModal = () => {
    if (!pendingTemplate) return;
    const text = pendingTemplate.content
      .replace(/{PACIENTE_NOME}/g, (patientName || "").toUpperCase())
      .replace(/{PACIENTE_CPF}/g, "___.___.___-__")
      .replace(/{PROFISSIONAL_NOME}/g, (professionalName || "").toUpperCase())
      .replace(/{DATA_ATUAL}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{CLINICA_NOME}/g, clinicName.toUpperCase());
    
    setParsedText(text);
    setModalOpen(true);
  };

  const confirmSignature = async (procedureName: string) => {
    if (!pendingTemplate || !clinicId || !patientId || !professionalId) return false;
    try {
        // Atualiza qualquer pendente para signed
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('patient_consents')
            .select('id')
            .eq('patient_id', patientId)
            .eq('template_id', pendingTemplate.id)
            .eq('status', 'pending')
            .gte('created_at', `${today}T00:00:00`)
            .maybeSingle();

        if (existing) {
            await supabase.from('patient_consents')
                .update({ status: 'signed', content_snapshot: parsedText, signed_at: new Date().toISOString() })
                .eq('id', existing.id);
        } else {
            await supabase.from('patient_consents').insert({
                clinic_id: clinicId, patient_id: patientId, professional_id: professionalId,
                template_id: pendingTemplate.id, procedure_name: procedureName,
                content_snapshot: parsedText, status: 'signed', signed_at: new Date().toISOString()
            });
        }
        
        setStatus('signed');
        setModalOpen(false);
        toast.success("Termo assinado manualmente.");
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
  };

  return { templates, status, setStatus, pendingTemplate, modalOpen, setModalOpen, parsedText, checkConsentRequirement, openModal, confirmSignature };
}