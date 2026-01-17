import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import { supabase } from "../../../lib/supabase"; 
import { toast } from "react-hot-toast";
import { ClinicalRecord } from "../types/clinical";
import { useAuth } from "../../../contexts/AuthContext";
import { addMinutes } from 'date-fns';

// Definições Locais de Tipo
export type PrescriptionComponent = { name: string; quantity: string };
export type PrescriptionTreatment = { 
  name: string; 
  components: PrescriptionComponent[]; 
  observations: string 
};

export function usePatientEvolution(patientId: string | undefined) {
  const { user, profile } = useAuth();
  const location = useLocation(); 
  const navigate = useNavigate();
  
  // ✅ Pega o ID enviado pelo Dashboard
  const navAppointmentId = location.state?.appointmentId || null;

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]); 
  const [stats, setStats] = useState({ totalVisits: 0, lastVisit: 'Nunca' });
  const [activePrescription, setActivePrescription] = useState<PrescriptionTreatment[]>([]);
  
  // ✅ Rastreia o agendamento em uso
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(navAppointmentId);

  const [context, setContext] = useState({ 
    clinicId: null as string | null, 
    clinicName: "", 
    professionalId: null as string | null, 
    professionalName: "", 
    patientName: "" 
  });

  // Auxiliar apenas para IMPRESSÃO (Visual)
  const toLocalISO = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // ✅ FUNÇÃO: INICIAR SESSÃO
  const startSession = async () => {
    if (!patientId || !user?.id) {
        toast.error("Erro: Usuário não autenticado.");
        return;
    }

    try {
      // 1. Busca Clinic ID (Blindado)
      let activeClinicId = profile?.clinic_id;
      
      if (!activeClinicId) {
          const { data: pData } = await supabase.from('patients').select('clinic_id').eq('id', patientId).single();
          activeClinicId = pData?.clinic_id;
      }

      if (!activeClinicId) {
          const { data: profData } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
          activeClinicId = profData?.clinic_id;
      }

      if (!activeClinicId) {
          toast.error("Erro Crítico: Clínica não identificada.");
          return;
      }

      const now = new Date(); 
      
      // 2. Limpa sessões antigas
      await supabase.from('appointments').update({
          status: 'completed',
          updated_at: now.toISOString()
      }).eq('professional_id', user.id).eq('status', 'arrived');

      let idToStart = currentAppointmentId;

      // 3. Busca agendamento existente
      if (!idToStart) {
        const todayStr = now.toISOString().split('T')[0]; 
        
        const { data: todayAppt } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patientId)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .limit(1)
          .maybeSingle();
        
        if (todayAppt) idToStart = todayAppt.id;
      }

      if (idToStart) {
        // Atualiza para arrived
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ 
            status: 'arrived', 
            updated_at: now.toISOString() 
        }).eq('id', idToStart);
        
        if (updateError) throw updateError;
        
        setCurrentAppointmentId(idToStart);
        toast.success("Atendimento iniciado!");
      } else {
        // Criação Avulsa
        const endTime = addMinutes(now, 30);

        const { data: newAppt, error: createError } = await supabase
          .from('appointments')
          .insert({
            clinic_id: activeClinicId,
            patient_id: patientId,
            professional_id: user.id,
            status: 'scheduled',             
            start_time: now.toISOString(),   
            end_time: endTime.toISOString(), 
            updated_at: now.toISOString(),
            service_id: null,                
            notes: 'Atendimento avulso iniciado via Prontuário'
          })
          .select('id')
          .single();

        if (createError) {
            console.error("ERRO AO CRIAR:", createError);
            toast.error(`Falha no agendamento: ${createError.message}`);
            return;
        }
        
        if (newAppt) {
            await supabase.from('appointments')
                .update({ status: 'arrived', updated_at: new Date().toISOString() })
                .eq('id', newAppt.id);

            setCurrentAppointmentId(newAppt.id);
            toast.success("Atendimento iniciado e agendado!");
        }
      }
    } catch (e: any) {
      console.error("Erro startSession:", e);
      toast.error("Erro ao iniciar sessão.");
    }
  };

  useEffect(() => {
    if (patientId && user) {
        fetchData();
    }
  }, [patientId, user, profile?.clinic_id]);

  const fetchData = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      
      const { data: patient } = await supabase
        .from('patients')
        .select(`name, clinic_id, clinics ( name )`)
        .eq('id', patientId)
        .single();

      const activeClinicId = profile?.clinic_id || patient?.clinic_id;
      const clinicName = (patient?.clinics as any)?.name || "Clínica de Estética";
      const p = profile as any;
      const profName = p?.fullName || p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || "Profissional";

      setContext({
        clinicId: activeClinicId,
        clinicName: clinicName, 
        professionalId: user?.id || null,
        professionalName: profName,
        patientName: patient?.name || "Paciente" 
      });

      const { data: hist, error: histError } = await supabase.from("evolution_records").select('*').eq("patient_id", patientId).order("date", { ascending: false });
      
      if (!histError && hist) {
          const profIds = [...new Set(hist.map(r => r.professional_id))];
          const { data: profs } = await supabase.from('profiles').select('id, first_name, last_name').in('id', profIds);

          const formatted: ClinicalRecord[] = hist.map((item: any) => {
              const prof = profs?.find(p => p.id === item.professional_id);
              return {
                  ...item,
                  professional: { fullName: prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() : "Profissional" },
                  attachments: {
                      photos: item.attachments?.photos || [],
                      prescription: (item.attachments?.prescription as unknown as PrescriptionTreatment[]) || [],
                      usedProducts: item.attachments?.usedProducts || []
                  }
              } as ClinicalRecord;
          });
          setRecords(formatted);
          setStats({
              totalVisits: formatted.filter(r => !r.deleted_at).length,
              lastVisit: formatted.length > 0 ? new Date(formatted[0].date.replace('Z', '')).toLocaleDateString('pt-BR') : 'Nunca'
          });
      }
      
      const { data: srvs } = await supabase
        .from('services') 
        .select('*')
        .eq('clinic_id', activeClinicId)
        .eq('is_active', true)
        .order('name');

      if (srvs && srvs.length > 0) {
          const serviceIds = srvs.map(s => s.id);
          const { data: kits } = await supabase
            .from('procedure_items') 
            .select(`procedure_id, quantity_needed, inventory:inventory_id (name)`)
            .in('procedure_id', serviceIds);

          const mergedServices = srvs.map(service => {
              const serviceKit = kits?.filter((k: any) => k.procedure_id === service.id) || [];
              return {
                  ...service,
                  products: serviceKit.map((k: any) => ({
                      name: k.inventory?.name || "Item sem nome",
                      quantity: k.quantity_needed,
                      unit: "un" 
                  }))
              };
          });
          setServicesList(mergedServices);
      } else {
          setServicesList([]);
      }

      const { data: tmpl } = await supabase.from('evolution_templates').select('*').eq('clinic_id', activeClinicId);
      setCustomTemplates(tmpl || []);

    } catch (err) { console.error("Erro fetchData:", err); } finally { setLoading(false); }
  }, [patientId, profile, user]);

  const addPrescriptionItem = () => {
    setActivePrescription([...activePrescription, { name: "", components: [{ name: "", quantity: "" }], observations: "" }]);
  };

  const updatePrescriptionItem = (index: number, data: PrescriptionTreatment) => {
    const newItems = [...activePrescription];
    newItems[index] = data;
    setActivePrescription(newItems);
  };

  const removePrescriptionItem = (index: number) => {
    setActivePrescription(activePrescription.filter((_, i) => i !== index));
  };

  const saveEvolution = async (data: any, files: File[]) => {
    if (!context.clinicId) { toast.error("Erro: Clínica não identificada."); return; }
    try {
        setLoading(true);
        const now = toLocalISO(new Date()); // Visual apenas
        
        // 1. Salva a Evolução
        const { data: newRecord, error: insertError } = await supabase.from("evolution_records").insert({
            clinic_id: context.clinicId, 
            patient_id: patientId, 
            professional_id: user?.id, 
            date: now, 
            subject: data.subject || "Evolução", 
            description: data.description,
            metadata: {
                patient_name: context.patientName,
                professional_name: context.professionalName,
                clinic_id: context.clinicId,
                clinic_name: context.clinicName, 
                subject_name: data.subject
            },
            attachments: {
                prescription: activePrescription,
                usedProducts: data.attachments?.usedProducts || [],
                photos: []
            }
        }).select().single();

        if (insertError) throw insertError;

        if (files.length > 0 && newRecord) {
            const photoUrls = [];
            for (const file of files) {
                const fileName = `${patientId}/${newRecord.id}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
                const { error: uploadError } = await supabase.storage.from('patient-photos').upload(fileName, file);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('patient-photos').getPublicUrl(fileName);
                    photoUrls.push(publicUrl);
                }
            }
            if (photoUrls.length > 0) {
                await supabase.from("evolution_records").update({ 
                  attachments: { ...newRecord.attachments, photos: photoUrls } 
                }).eq('id', newRecord.id);
            }
        }

        if (data.return_date) {
            const startDateTime = new Date(data.return_date);
            const service = servicesList.find(s => s.id === data.return_procedure_id);
            await supabase.from('appointments').insert({
                clinic_id: context.clinicId, patient_id: patientId, professional_id: user?.id,
                service_id: data.return_procedure_id || null,
                start_time: startDateTime.toISOString(),
                end_time: addMinutes(startDateTime, service?.duration || 30).toISOString(),
                status: 'scheduled', notes: 'Retorno gerado via Prontuário'
            });
        }

        // ✅ Finaliza sessão E LIMPA O ESTADO LOCAL
        if (currentAppointmentId) {
            await supabase.from('appointments').update({ 
                status: 'completed', 
                updated_at: new Date().toISOString() 
            }).eq('id', currentAppointmentId);

            // CORREÇÃO CRÍTICA: Remove o ID da memória para não reabrir o timer
            setCurrentAppointmentId(null);
            
            // Limpa o histórico de navegação
            navigate(location.pathname, { replace: true, state: {} });
        }

        toast.success("Evolução salva!");
        setActivePrescription([]); 
        await fetchData(); 
    } catch (err: any) { toast.error(`Erro: ${err.message}`); } finally { setLoading(false); }
  };

  const printRecord = (record: ClinicalRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dynamicClinicName = record.metadata?.clinic_name || context.clinicName || "Clínica de Estética";
    const date = new Date(record.date.replace('Z', '')).toLocaleString('pt-BR');
    
    const treatments = (record.attachments?.prescription as unknown as PrescriptionTreatment[]) || [];
    
    printWindow.document.write(`
      <html>
        <head>
          <title>PRONTUÁRIO - ${dynamicClinicName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20mm; color: #1a1a1a; }
            .header { border-bottom: 4px solid #db2777; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .header h1 { margin: 0; color: #db2777; font-weight: 900; text-transform: uppercase; font-size: 26px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #fdf2f8; padding: 20px; border-radius: 15px; border: 1px solid #fbcfe8; font-size: 13px; }
            .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #db2777; border-left: 4px solid #db2777; padding-left: 10px; margin: 25px 0 10px 0; }
            .box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; font-size: 13px; white-space: pre-wrap; background: #fff; }
            .prescription-box { margin-top: 15px; border: 2px dashed #db2777; padding: 20px; border-radius: 20px; background: #fff; }
            .t-item { margin-bottom: 20px; }
            .t-name { font-weight: 900; color: #9d174d; text-transform: uppercase; font-size: 14px; margin-bottom: 5px; }
            .c-list { font-size: 12px; color: #4b5563; list-style: none; padding: 0; margin: 0 0 10px 0; }
            .obs { font-style: italic; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 5px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; }
            .sig { border-top: 1px solid #000; width: 250px; margin: 40px auto 0 auto; padding-top: 5px; font-weight: 700; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1>${dynamicClinicName}</h1><p>REGISTRO CLÍNICO OFICIAL</p></div>
            <div style="text-align: right"><span>#${record.id.slice(0,8).toUpperCase()}</span></div>
          </div>
          <div class="grid">
            <div><strong>Paciente:</strong> ${record.metadata?.patient_name || context.patientName}</div>
            <div><strong>Data:</strong> ${date}</div>
            <div><strong>Procedimento:</strong> ${record.subject}</div>
            <div><strong>Profissional:</strong> ${record.professional?.fullName || record.metadata?.professional_name}</div>
          </div>
          <div class="section-title">Evolução Técnica</div>
          <div class="box">${record.description}</div>
          
          ${treatments.length > 0 ? `
            <div class="section-title">Prescrição Home Care</div>
            <div class="prescription-box">
              ${treatments.map((t: PrescriptionTreatment) => `
                <div class="t-item">
                  <div class="t-name">${t.name}</div>
                  <ul class="c-list">
                    ${t.components.map((c: PrescriptionComponent) => c.name ? `<li>• ${c.name} : <strong>${c.quantity}</strong></li>` : '').join('')}
                  </ul>
                  ${t.observations ? `<div class="obs">${t.observations}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <div class="sig">${record.professional?.fullName || record.metadata?.professional_name}</div>
            <p>${dynamicClinicName} - Documento Gerado Via Sistema</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const invalidateRecord = async (id: string) => {
    const { error } = await supabase.from("evolution_records").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (!error) { fetchData(); toast.success("Registro invalidado."); }
  };

  return { 
    loading, records, servicesList, customTemplates, stats, context, 
    activePrescription, addPrescriptionItem, updatePrescriptionItem, removePrescriptionItem,
    saveEvolution, invalidateRecord, 
    saveNewTemplate: async (title: string, description: string) => {
      await supabase.from('evolution_templates').insert({ clinic_id: context.clinicId, professional_id: user?.id, title, description });
      fetchData();
    }, 
    deleteTemplate: async (id: string) => {
      await supabase.from('evolution_templates').delete().eq('id', id);
      fetchData();
    }, 
    startSession, 
    activeAppointmentId: currentAppointmentId, 
    printRecord
  };
}