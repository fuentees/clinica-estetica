import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; 
import { toast } from "react-hot-toast";
import { ClinicalRecord } from "../types/clinical";
import { useAuth } from "../../../contexts/AuthContext";
import { addMinutes } from 'date-fns';

export type PrescriptionComponent = { name: string; quantity: string };
export type PrescriptionTreatment = { 
  name: string; 
  components: PrescriptionComponent[]; 
  observations: string 
};

export function usePatientEvolution(patientId: string | undefined) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]); 
  const [stats, setStats] = useState({ totalVisits: 0, lastVisit: 'Nunca' });
  const [activePrescription, setActivePrescription] = useState<PrescriptionTreatment[]>([]);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  const [context, setContext] = useState({ 
    clinicId: null as string | null, 
    clinicName: "", // ✅ Agora será preenchido dinamicamente
    professionalId: null as string | null, 
    professionalName: "", 
    patientName: "" 
  });

  const toLocalISO = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  useEffect(() => {
    if (patientId && user) {
        fetchData();
        checkActiveAppointment();
    }
  }, [patientId, user, profile?.clinic_id]);

  async function checkActiveAppointment() {
      if (!patientId) return;
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('appointments')
          .select('id, status')
          .eq('patient_id', patientId)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .in('status', ['scheduled', 'confirmed', 'arrived'])
          .limit(1)
          .maybeSingle();

        if (data) {
            setActiveAppointmentId(data.id);
            if (data.status !== 'arrived') {
                await supabase.from('appointments').update({ status: 'arrived' }).eq('id', data.id);
            }
        }
      } catch (e) { console.error("Erro checkAppointment", e); }
  }

  const fetchData = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      
      // ✅ Puxando o nome da clínica via JOIN com a tabela 'clinics'
      const { data: patient } = await supabase
        .from('patients')
        .select(`
          name, 
          clinic_id, 
          clinics (
            name
          )
        `)
        .eq('id', patientId)
        .single();

      const activeClinicId = profile?.clinic_id || patient?.clinic_id;
      // ✅ Aqui pegamos o nome real configurado no banco de dados
      const clinicName = (patient?.clinics as any)?.name || "Clínica de Estética";
      
      const p = profile as any;
      const profName = p?.fullName || p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || "Profissional";

      setContext({
        clinicId: activeClinicId,
        clinicName: clinicName, // ✅ Nome dinâmico injetado aqui
        professionalId: user?.id || null,
        professionalName: profName,
        patientName: patient?.name || "Paciente" 
      });

      const { data: hist, error: histError } = await supabase.from("evolution_records").select('*').eq("patient_id", patientId).order("date", { ascending: false });
      if (histError) throw histError;

      if (hist) {
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
      
      const { data: srvs } = await supabase.from('services').select('*').eq('clinic_id', activeClinicId).eq('is_active', true);
      setServicesList(srvs || []);
      const { data: tmpl } = await supabase.from('evolution_templates').select('*').eq('clinic_id', activeClinicId);
      setCustomTemplates(tmpl || []);

    } catch (err) { console.error("Erro fetchData:", err); } finally { setLoading(false); }
  };

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

  const saveEvolution = async (data: any, files: File[] = []) => {
    if (!context.clinicId) { toast.error("Erro: Clínica não identificada."); return; }
    try {
        setLoading(true);
        const now = toLocalISO(new Date());
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
                clinic_name: context.clinicName, // ✅ Gravando o nome dinâmico no histórico
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
                start_time: toLocalISO(startDateTime),
                end_time: toLocalISO(addMinutes(startDateTime, service?.duration || 30)),
                status: 'scheduled', notes: 'Retorno gerado via Prontuário'
            });
        }
        if (activeAppointmentId) await supabase.from('appointments').update({ status: 'completed' }).eq('id', activeAppointmentId);

        toast.success("Salvo com sucesso!");
        setActivePrescription([]); 
        await fetchData(); 
    } catch (err: any) { toast.error(`Erro: ${err.message}`); } finally { setLoading(false); }
  };

  const printRecord = (record: ClinicalRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // ✅ Puxando o nome da clínica dos metadados salvos ou do contexto atual
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
              ${treatments.map(t => `
                <div class="t-item">
                  <div class="t-name">${t.name}</div>
                  <ul class="c-list">
                    ${t.components.map(c => c.name ? `<li>• ${c.name} : <strong>${c.quantity}</strong></li>` : '').join('')}
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
    saveEvolution, invalidateRecord, saveNewTemplate: async (title: string, description: string) => {
      await supabase.from('evolution_templates').insert({ clinic_id: context.clinicId, professional_id: user?.id, title, description });
      fetchData();
    }, deleteTemplate: async (id: string) => {
      await supabase.from('evolution_templates').delete().eq('id', id);
      fetchData();
    }, activeAppointmentId, printRecord
  };
}