import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface ConsentTemplate {
  id: string;
  title: string;
  content: string;
  procedure_keywords: string[];
}

export function useConsentManager(clinicId: string) {
  const [fetching, setFetching] = useState(false);
  const [template, setTemplate] = useState<{ id: string | null; title: string; content: string } | null>(null);

  const loadTemplate = useCallback(async (procedureName: string, patientId: string) => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('deleted_at', null);

      if (error) throw error;

      const match = (data as ConsentTemplate[])?.find(t => 
        t.procedure_keywords?.some(k => procedureName.toLowerCase().includes(k.toLowerCase()))
      );

      let rawContent = match?.content || 
        "TERMO DE CONSENTIMENTO PARA {PROCEDIMENTO}\n\nDeclaro que fui informado(a) sobre os benefícios, riscos e cuidados...";
      
      const formattedContent = rawContent
        .replace(/{PROCEDIMENTO}/g, procedureName.toUpperCase())
        .replace(/{DATA}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{PATIENT_ID}/g, patientId);

      setTemplate({
        id: match?.id || null,
        title: match?.title || `TERMO: ${procedureName.toUpperCase()}`,
        content: formattedContent
      });
    } catch (err) {
      console.error(err);
      setTemplate({ id: null, title: "Erro", content: "ERRO AO CARREGAR O TERMO." });
    } finally {
      setFetching(false);
    }
  }, [clinicId]);

  return { fetching, template, loadTemplate };
}