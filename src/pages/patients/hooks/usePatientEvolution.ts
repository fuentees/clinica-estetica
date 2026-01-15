import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; 
import { toast } from "react-hot-toast";
import { ClinicalRecord } from "../types/clinical";

export function usePatientEvolution(patientId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]); 
  const [stats, setStats] = useState({ totalVisits: 0, lastVisit: 'Nunca' });
  const [context, setContext] = useState({ 
    clinicId: null as string | null, 
    professionalId: null as string | null, 
    professionalName: "", 
    patientName: "" 
  });

  useEffect(() => {
    if (patientId) fetchData();
  }, [patientId]);

  const fetchCustomTemplates = async (clinicId: string) => {
    try {
      const { data } = await supabase
        .from('evolution_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('title');
      setCustomTemplates(data || []);
    } catch (err) {
      console.error("Erro ao buscar templates:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: patient } = await supabase.from('patients').select('full_name').eq('id', patientId).single();
      
      setContext({
        clinicId: profile?.clinic_id,
        professionalId: profile?.id,
        professionalName: profile ? `${profile.first_name} ${profile.last_name}` : "",
        patientName: patient?.full_name || "Paciente"
      });

      if (profile?.clinic_id) {
          const { data: srv } = await supabase.from('services').select('id, name').eq('clinic_id', profile.clinic_id).order('name');
          const { data: inv } = await supabase.from('inventory').select('id, name, quantity, batch').eq('clinic_id', profile.clinic_id).order('name');
          setServicesList(srv || []);
          setInventoryList(inv || []);

          await fetchCustomTemplates(profile.clinic_id);

          const { data: hist } = await supabase
            .from("evolution_records") 
            .select(`*, profiles:professional_id (first_name, last_name, role)`)
            .eq("patient_id", patientId)
            .order("date", { ascending: false });
          
          const formatted: ClinicalRecord[] = (hist || []).map((item: any) => ({
              ...item,
              attachments: item.attachments || {}
          }));
          setRecords(formatted);
          
          const validRecords = formatted.filter(r => !r.deleted_at);
          if (validRecords.length > 0) {
              setStats({
                  totalVisits: validRecords.length,
                  lastVisit: new Date(validRecords[0].date).toLocaleDateString('pt-BR')
              });
          }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const saveEvolution = async (data: any, files: File[] = []) => {
    if (!context.clinicId) return;
    try {
        let photoUrls: string[] = [];
        if (files.length > 0) {
            const uploadPromises = files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${patientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${context.clinicId}/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('evolution-attachments').upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('evolution-attachments').getPublicUrl(filePath);
                return publicUrl;
            });
            photoUrls = await Promise.all(uploadPromises);
        }
        const finalData = { ...data, attachments: { ...data.attachments, photos: photoUrls } };
        const { error } = await supabase.from("evolution_records").insert({
            clinic_id: context.clinicId, patient_id: patientId, professional_id: context.professionalId, ...finalData
        });
        if (error) throw error;
        toast.success("Salvo com sucesso!");
        fetchData();
    } catch (err) {
        console.error("Erro ao salvar:", err);
        toast.error("Erro ao salvar prontuário.");
        throw err;
    }
  };

  const saveNewTemplate = async (title: string, description: string, templateId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
    const activeClinicId = context.clinicId || profile?.clinic_id;
    if (!activeClinicId) { toast.error("Clínica não identificada."); return; }

    try {
      const payload = { clinic_id: activeClinicId, professional_id: context.professionalId, title, description };
      if (templateId) {
        const { error } = await supabase.from('evolution_templates').update(payload).eq('id', templateId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('evolution_templates').insert(payload);
        if (error) throw error;
      }
      await fetchCustomTemplates(activeClinicId);
    } catch (err) {
      console.error("Erro ao salvar modelo:", err);
      throw err;
    }
  };

  // ✅ FUNÇÃO DELETAR (A QUE ESTAVA FALTANDO NO RETORNO)
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('evolution_templates').delete().eq('id', id);
      if (error) throw error;
      if (context.clinicId) await fetchCustomTemplates(context.clinicId);
    } catch (err) {
      console.error("Erro ao excluir modelo:", err);
      throw err;
    }
  };

  const invalidateRecord = async (id: string) => {
    await supabase.from("evolution_records").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    fetchData();
    toast.success("Registro invalidado.");
  };

  return { 
    loading, records, servicesList, inventoryList, customTemplates, stats, context, 
    saveEvolution, invalidateRecord, saveNewTemplate, deleteTemplate // ✅ AGORA ESTÁ AQUI
  };
}