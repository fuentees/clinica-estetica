import { useState, useMemo } from "react";
import { 
  Search, Printer, ChevronDown, User, 
  Camera, Pill, AlertTriangle, CheckCircle, Ban, MoreVertical, 
  FileText, ArrowRightCircle, Clock, Filter, Image as ImageIcon, Syringe, FileSignature
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "../../../components/components/ui/dropdown-menu";

import { getProcedureColor } from "../utils/getProcedureColor";

// Configuração de Tipos para ícones e cores
const getTypeConfig = (subject: string) => {
  const s = subject?.toLowerCase() || "";
  if (s.includes("intercorrência")) return { label: "Intercorrência", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle size={12}/> };
  if (s.includes("retorno") || s.includes("avaliação")) return { label: "Avaliação", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <ArrowRightCircle size={12}/> };
  return { label: "Procedimento", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Syringe size={12}/> };
};

// Helper para definir o conselho baseado na formação (igual ao receituário avulso)
const getCouncilLabel = (formacao?: string) => {
    if (!formacao) return "Registro";
    const f = formacao.toLowerCase();
    if (f.includes('bioméd') || f.includes('biomed')) return "CRBM";
    if (f.includes('farmac')) return "CRF";
    if (f.includes('enferm')) return "COREN";
    if (f.includes('fisiotera')) return "CREFITO";
    if (f.includes('medic') || f.includes('médic') || f.includes('dermatologista')) return "CRM";
    return "Registro";
};

// ✅ Adicionado clinicData nas props
export function EvolutionTimeline({ records, onSearch, onSelectRecord, onInvalidate, onPrint, patientName, clinicData }: any) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | 'prescription' | 'alert'>('all');

  // ✅ NOVA FUNÇÃO DE IMPRESSÃO PREMIUM (Layout Padronizado)
  const handlePrintPrescription = (record: any) => {
    const prescriptionData = record.attachments?.prescription;
    if (!prescriptionData || prescriptionData.length === 0) return;

    // Dados do Profissional
    const prof = record.professional || {};
    const profName = prof.fullName || record.metadata?.professional_name || "Profissional";
    const profReg = prof.registration || "";
    const profSpec = prof.formacao || "Especialista"; // Tenta pegar formação ou usa default
    const council = getCouncilLabel(profSpec);
    // Tenta pegar a assinatura do objeto profissional (se disponível no join)
    const signatureUrl = prof.signature_url || prof.signature_data; 

    // Dados da Clínica (Via Props)
    const clinicName = clinicData?.name || "CLÍNICA";
    const clinicAddress = clinicData?.address ? `${clinicData.address} • ${clinicData.phone || ''}` : "";
    const clinicLogo = clinicData?.logo_url;

    const dateStr = new Date(record.date).toLocaleDateString('pt-BR');

    // Prepara o HTML do Logo
    const logoHtml = clinicLogo 
      ? `<img src="${clinicLogo}" alt="${clinicName}" style="max-height: 80px; max-width: 250px; object-fit: contain;" />` 
      : `<h1 class="clinic-name-print">${clinicName}</h1>`;

    const printWindow = window.open('', '_blank', 'height=800,width=900');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prescrição - ${patientName}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Open+Sans:wght@400;600&display=swap');
              @page { margin: 0; size: A4; }
              body { 
                  background: white !important; 
                  padding: 0; 
                  margin: 0; 
                  font-family: 'Open Sans', sans-serif; 
                  color: #333;
                  line-height: 1.5;
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
              }
              .print-container { padding: 40px; max-width: 800px; margin: 0 auto; min-height: 95vh; position: relative; }
              
              /* Header Premium */
              .header-print { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 40px; }
              .clinic-name-print { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 24px; color: #065f46; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
              .clinic-sub-print { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
              .doc-type-print { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 12px; color: #059669; text-transform: uppercase; letter-spacing: 2px; text-align: right; }
              .doc-date-print { font-size: 14px; font-weight: 800; font-style: italic; color: #111; margin-top: 4px; text-align: right; }

              /* Paciente */
              .patient-box-print { background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
              .patient-label-print { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 1px; mb-1; }
              .patient-name-print { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; text-transform: uppercase; }

              /* Itens da Receita */
              .treatment-item-print { margin-bottom: 30px; page-break-inside: avoid; }
              .treatment-name-print { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 800; text-transform: uppercase; color: #064e3b; margin-bottom: 10px; padding-left: 15px; border-left: 3px solid #d1fae5; }
              .component-row-print { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; color: #4b5563; width: 80%; margin-left: 15px; }
              .obs-box-print { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6; margin-top: 10px; margin-left: 15px; font-size: 13px; font-style: italic; color: #6b7280; }

              /* Rodapé */
              .footer-print { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 40px; background: white; }
              .signature-img-print { height: 70px; display: block; margin: 0 auto 10px auto; }
              .prof-line-print { width: 250px; border-top: 1px solid #d1d5db; margin: 0 auto 10px auto; }
              .prof-name-print { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 14px; text-transform: uppercase; color: #111; }
              .prof-reg-print { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; mt-1; }
              .clinic-footer-print { font-size: 9px; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="print-container">
                
                <div class="header-print">
                  <div>
                    ${logoHtml}
                    <p class="clinic-sub-print">${clinicAddress}</p>
                  </div>
                  <div class="text-right">
                    <p class="doc-type-print">Prescrição Home Care</p>
                    <p class="doc-date-print">${dateStr}</p>
                    <p style="font-size: 10px; color: #999; margin-top: 2px;">Ref: ${record.id.slice(0,8)}</p>
                  </div>
                </div>

                <div class="patient-box-print">
                  <p class="patient-label-print">Paciente</p>
                  <p class="patient-name-print">${patientName || 'Nome do Paciente'}</p>
                </div>

                <div class="space-y-8">
                  ${prescriptionData.map((item: any, idx: number) => `
                    <div class="treatment-item-print">
                      <h4 class="treatment-name-print">${idx + 1}. ${item.name}</h4>

                      ${item.components && item.components.length > 0 ? `
                        <div class="mb-4 pl-4 w-3/4">
                          ${item.components.map((c: any) => `
                            <div class="component-row-print">
                              <span style="font-weight: 600;">${c.name}</span>
                              <span style="font-weight: 800; font-style: italic;">${c.quantity}</span>
                            </div>
                          `).join('')}
                        </div>
                      ` : ''}

                      <div class="obs-box-print">
                        <strong>Modo de Uso:</strong> ${item.observations || 'Conforme orientação verbal.'}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <div class="footer-print">
                     ${signatureUrl ? `<img src="${signatureUrl}" class="signature-img-print" alt="Assinatura" />` : '<div style="height: 70px;"></div>'}
                     <div class="prof-line-print"></div>
                     <p class="prof-name-print">Dr(a). ${profName}</p>
                     <p class="prof-reg-print">${council}: ${profReg}</p>
                     <p class="clinic-footer-print">Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')}</p>
                </div>
            </div>
            <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Lógica de Agrupamento e Filtragem Memoizada
  const { groupedRecords, hasMore, totalFiltered } = useMemo(() => {
    let filtered = records.filter((r: any) => {
        if (r.deleted_at) return false; 
        if (activeFilter === 'photos') return r.attachments?.photos?.length > 0;
        if (activeFilter === 'prescription') return r.attachments?.prescription?.length > 0;
        if (activeFilter === 'alert') return r.subject.toLowerCase().includes('intercorrência');
        return true;
    });

    const total = filtered.length;
    const hasMoreItems = total > visibleCount;
    const slicedRecords = filtered.slice(0, visibleCount);

    const groups: { [key: string]: any[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    slicedRecords.forEach((rec: any) => {
      const datePart = rec.date.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const compareDate = new Date(year, month - 1, day);
      const diffDays = Math.round((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));

      let label = "Antigos";
      if (diffDays === 0) label = "Hoje";
      else if (diffDays === 1) label = "Ontem";
      else if (diffDays > 1 && diffDays < 7) label = "Últimos 7 dias";
      else if (diffDays >= 7 && diffDays < 30) label = "Este Mês";
      else if (diffDays >= 30 && diffDays < 365) label = "Este Ano";
      else label = `Em ${year}`;

      if (!groups[label]) groups[label] = [];
      groups[label].push(rec);
    });

    return { groupedRecords: groups, hasMore: hasMoreItems, totalFiltered: total };
  }, [records, visibleCount, activeFilter]);

  return (
    <div className="space-y-8">
      
      {/* BARRA DE CONTROLE (BUSCA + FILTROS) */}
      <div className="space-y-4 no-print">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={20}/>
          <input 
            onChange={e => onSearch(e.target.value)} 
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-bold text-sm shadow-sm" 
            placeholder="Pesquisar no histórico clínico (ex: Botox, 12/05)..."
          />
        </div>

        {/* CHIPS DE FILTRO */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                Todos ({records.length})
            </button>
            <button onClick={() => setActiveFilter('photos')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'photos' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200'}`}>
                <ImageIcon size={14}/> Com Fotos
            </button>
            <button onClick={() => setActiveFilter('prescription')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'prescription' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200'}`}>
                <Pill size={14}/> Receitas
            </button>
            <button onClick={() => setActiveFilter('alert')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'alert' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:border-red-200'}`}>
                <AlertTriangle size={14}/> Intercorrências
            </button>
        </div>
      </div>

      {/* TIMELINE RENDER */}
      <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-8 pb-10">
        {Object.entries(groupedRecords).map(([label, items]) => (
          <div key={label} className="space-y-6">
            
            {/* LABEL DO GRUPO */}
            <div className="flex items-center -ml-[9px] mt-8">
              <div className="w-4 h-4 rounded-full bg-pink-500 border-4 border-white shadow-md"></div>
              <span className="ml-4 text-xs font-black uppercase text-pink-500 tracking-[0.3em] bg-pink-50 px-3 py-1 rounded-lg border border-pink-100">
                {label}
              </span>
            </div>

            <div className="space-y-4 pl-6">
              {items.map((item: any) => {
                const isExpanded = expandedId === item.id;
                const isInvalidated = !!item.deleted_at;
                const type = getTypeConfig(item.subject);
                const procedureColorClass = getProcedureColor(item.subject);
                const hasPhotos = item.attachments?.photos?.length > 0;
                const hasPrescription = Array.isArray(item.attachments?.prescription) && item.attachments.prescription.length > 0;

                return (
                  <div 
                    key={item.id} 
                    className={`group transition-all duration-300 border rounded-[2rem] overflow-hidden hover:shadow-md relative bg-white ${
                      isInvalidated ? 'opacity-60 grayscale border-gray-100' : isExpanded ? 'shadow-xl ring-1 ring-pink-100 border-pink-200' : 'border-gray-100'
                    }`}
                  >
                    {/* LINHA DE STATUS LATERAL */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isInvalidated ? 'bg-red-300' : type.color.split(' ')[0].replace('bg-', 'bg-').replace('100', '400')}`}></div>

                    <div 
                      onClick={() => !isInvalidated && setExpandedId(isExpanded ? null : item.id)}
                      className={`p-5 pl-6 flex items-start justify-between gap-4 ${!isInvalidated ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Tags e Hora */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wide ${type.color}`}>
                            {type.icon} {type.label}
                          </span>
                          
                          <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <Clock size={12}/> 
                            {(() => {
                              try { return item.date.split('T')[1].substring(0, 5); } 
                              catch (e) { return "--:--"; }
                            })()}
                          </span>

                          {/* Ícones de Anexo (Badges) */}
                          <div className="flex gap-2">
                            {hasPhotos && <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><Camera size={12}/> {item.attachments.photos.length}</span>}
                            {hasPrescription && <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><Pill size={12}/> Receita</span>}
                          </div>
                        </div>

                        {/* Título do Procedimento */}
                        <h4 className={`font-black text-base uppercase tracking-tight ${isInvalidated ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.subject}
                        </h4>
                        
                        {/* Preview rápido */}
                        {!isExpanded && (
                            <p className="text-xs text-gray-400 truncate mt-1 italic max-w-md">{item.description.replace(/\n/g, ' ')}</p>
                        )}
                      </div>

                      {/* Menu de Ações */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 hover:bg-gray-100"><MoreVertical size={18} className="text-gray-400"/></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl w-64 p-2 shadow-xl border-gray-100">
                            <DropdownMenuLabel className="text-[10px] uppercase text-gray-400 font-black px-3 py-2 tracking-widest">Ações do Registro</DropdownMenuLabel>
                            
                            {/* ✅ BOTÃO DE IMPRIMIR RECEITA (PREMIUM) */}
                            {hasPrescription && !isInvalidated && (
                                <DropdownMenuItem className="rounded-xl gap-3 font-bold text-xs p-3 cursor-pointer bg-emerald-50 text-emerald-700 focus:bg-emerald-100 mb-1" onClick={() => handlePrintPrescription(item)}>
                                  <FileSignature size={16}/> Imprimir Receita
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem className="rounded-xl gap-3 font-bold text-xs p-3 cursor-pointer" onClick={() => onPrint(item)} disabled={isInvalidated}>
                              <Printer size={16} className="text-pink-500"/> Imprimir Evolução Completa
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl gap-3 font-bold text-xs p-3 cursor-pointer" onClick={() => onSelectRecord(item)} disabled={isInvalidated}>
                              <FileText size={16} className="text-blue-500"/> Ver Detalhes
                            </DropdownMenuItem>
                            {!isInvalidated && (
                              <>
                                <DropdownMenuSeparator className="my-1"/>
                                <DropdownMenuItem className="rounded-xl gap-3 font-bold text-xs p-3 text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => {if(window.confirm("Invalidar registro?")) onInvalidate(item.id)}}>
                                  <Ban size={16}/> Invalidar Registro
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                         </DropdownMenu>
                        
                        {!isInvalidated && (
                           <div className={`transition-transform duration-300 p-2 rounded-full ${isExpanded ? 'rotate-180 bg-pink-50 text-pink-500' : 'text-gray-300'}`}>
                              <ChevronDown size={20} />
                           </div>
                        )}
                      </div>
                    </div>

                    {/* --- CONTEÚDO EXPANDIDO --- */}
                    {isExpanded && !isInvalidated && (
                      <div className="px-6 pb-8 pl-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="h-px bg-gray-100 mb-6" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Coluna 1: Texto e Receita */}
                          <div className="lg:col-span-2 space-y-6">
                             <div className={`text-sm leading-relaxed text-gray-700 whitespace-pre-wrap bg-gray-50 p-6 rounded-[1.5rem] border-l-4 ${procedureColorClass} shadow-inner`}>
                                 {item.description}
                             </div>

                             {/* RECEITA VISUAL COM BOTÃO DE IMPRIMIR */}
                             {hasPrescription && (
                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2"><Pill size={14}/> Prescrição Vinculada</h5>
                                        {/* ✅ Botão de Imprimir Rápido */}
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); handlePrintPrescription(item); }}
                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest px-4 shadow-sm"
                                        >
                                            <Printer size={12} className="mr-2"/> Imprimir Receita
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {item.attachments.prescription.map((p: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-50 shadow-sm flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-gray-800">{p.name || p.drug}</span>
                                                    <span className="text-[10px] text-gray-400 italic mt-0.5 truncate max-w-[200px]">{p.observations}</span>
                                                </div>
                                                <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg whitespace-nowrap">{p.components?.length || 0} ativos</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                          </div>

                          {/* Coluna 2: Metadados e Fotos */}
                          <div className="space-y-6">
                             <div className="bg-white border border-gray-100 p-5 rounded-[1.5rem] shadow-sm">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Profissional</label>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><User size={12}/></div>
                                  {item.professional?.fullName || item.metadata?.professional_name || "Não identificado"}
                                </div>
                             </div>

                             {hasPhotos && (
                                 <div className="grid grid-cols-2 gap-2">
                                     {item.attachments.photos.map((url: string, i: number) => (
                                         <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform" onClick={() => window.open(url, '_blank')}>
                                             <img src={url} className="w-full h-full object-cover"/>
                                         </div>
                                     ))}
                                 </div>
                             )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* BOTÃO LOAD MORE */}
      {hasMore && (
          <div className="flex justify-center pt-4 pb-12 pl-6 border-l-2 border-dashed border-gray-200 ml-4">
              <Button 
                onClick={() => setVisibleCount(prev => prev + 10)} 
                variant="outline" 
                className="h-12 px-8 rounded-full border-2 border-gray-200 text-gray-500 hover:border-pink-500 hover:text-pink-600 font-bold uppercase tracking-widest text-xs bg-white shadow-sm transition-all hover:scale-105"
              >
                  <ChevronDown size={16} className="mr-2"/> Ver Mais Histórico
              </Button>
          </div>
      )}

      {!hasMore && totalFiltered > 0 && (
          <div className="text-center pb-10 pl-6 border-l-2 border-dashed border-gray-200 ml-4">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Fim do Histórico</p>
          </div>
      )}

      {totalFiltered === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">Nenhum registro encontrado.</p>
          </div>
      )}
    </div>
  );
}