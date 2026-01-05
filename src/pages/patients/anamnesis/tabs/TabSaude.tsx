import { useFormContext, useWatch } from "react-hook-form";
import { 
  Activity, ShieldAlert, Pill, History, 
  HeartPulse, Thermometer, UserCircle, Zap, AlertCircle
} from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

export function TabSaude() {
  const { register, control } = useFormContext();
  
  // Observando estados para renderização condicional
  const usaMedicacao = useWatch({ name: "usa_medicacao_continua", control });
  const fezCirurgia = useWatch({ name: "ja_fez_cirurgia", control });
  const praticaAtividade = useWatch({ name: "atividade_fisica", control });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 1. ALERTAS CRÍTICOS (Zona Vermelha de Segurança) */}
        <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <ShieldAlert size={180} className="text-red-900 dark:text-red-100"/>
            </div>
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-200 dark:shadow-none">
                    <ShieldAlert className="text-white" size={24}/>
                </div>
                <div>
                  <h4 className="text-red-900 dark:text-red-100 font-black text-xl uppercase tracking-tighter italic">Fatores de Risco</h4>
                  <p className="text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest">Atenção imediata: Contraindicações absolutas ou relativas</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 relative z-10">
                <Components.CheckboxItem name="gestante" label="Gestante" register={register} />
                <Components.CheckboxItem name="lactante" label="Lactante" register={register} />
                <Components.CheckboxItem name="marca_passo" label="Uso de Marcapasso" register={register} />
                <Components.CheckboxItem name="uso_anticoagulante" label="Anticoagulantes" register={register} />
                <Components.CheckboxItem name="uso_retinoide" label="Uso de Isotretinoína" register={register} />
                <Components.CheckboxItem name="historico_queloide" label="Tendência Quelóide" register={register} />
                <Components.CheckboxItem name="implantes_metalicos" label="Implantes Metálicos" register={register} />
                <Components.CheckboxItem name="fumante" label="Hábito Tabagista" register={register} />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. SAÚDE SISTÊMICA */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 transition-all group-hover:w-3"></div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 italic uppercase tracking-tighter">
                    <HeartPulse size={24} className="text-blue-500"/> Saúde Sistêmica
                </h3>
                
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-y-4">
                        <Components.CheckboxItem name="possui_diabetes" label="Diabetes" register={register} />
                        <Components.CheckboxItem name="possui_hipertensao" label="Hipertensão" register={register} />
                        <Components.CheckboxItem name="alteracoes_hormonais" label="Tireoide / Hormonal" register={register} />
                        <Components.CheckboxItem name="doenca_hepatica" label="Hepatite / Hepática" register={register} />
                    </div>
                    
                    <div className="pt-8 border-t border-gray-50 dark:border-gray-700">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block tracking-widest">
                          Patologias Crônicas / Autoimunes
                        </label>
                        <Components.CheckboxGroup name="doencas_cronicas" label="" options={Constants.DOENCAS} control={control} />
                        
                        <div className="mt-6 flex items-center gap-2 border-b-2 border-dashed border-gray-100 dark:border-gray-700 pb-2">
                            <Zap size={14} className="text-blue-400"/>
                            <input 
                                {...register("outras_patologias_descricao")} 
                                className="w-full bg-transparent outline-none text-sm font-medium text-gray-600 dark:text-gray-400 placeholder-gray-300 italic" 
                                placeholder="Especificar outras patologias..." 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. HISTÓRICO E INTERVENÇÕES ANTERIORES */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-purple-500 transition-all group-hover:w-3"></div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 italic uppercase tracking-tighter">
                    <History size={24} className="text-purple-500"/> Histórico Clínico
                </h3>
                
                <div className="space-y-6">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                      <Components.CheckboxItem name="ja_fez_cirurgia" label="Possui cirurgias prévias?" register={register} />
                      
                      {fezCirurgia && (
                          <textarea 
                              {...register("detalhes_cirurgia")} 
                              className="w-full mt-4 p-4 bg-white dark:bg-gray-900 border-0 rounded-xl text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-purple-200 animate-in slide-in-from-top-2 duration-300 shadow-inner" 
                              placeholder="Quais cirurgias e quanto tempo atrás?" 
                          />
                      )}
                    </div>
                    
                    <div className="pt-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-4 block tracking-widest italic">Intervenções Estéticas Anteriores:</label>
                        <Components.CheckboxGroup 
                            name="procedimentos_previos" 
                            label="" 
                            options={Constants.HISTORICO_PROCEDIMENTOS} 
                            control={control} 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* 4. MEDICAMENTOS & ALERGIAS (Foco em Farmacologia) */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <h4 className="font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase text-sm tracking-widest italic">
                <Pill className="text-emerald-500"/> Farmacologia & Alergias
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <Components.CheckboxItem name="usa_medicacao_continua" label="Faz uso de medicação contínua?" register={register} />
                    
                    {usaMedicacao && (
                        <div className="animate-in slide-in-from-top-2">
                          <textarea 
                              {...register("lista_medicacoes")} 
                              className="w-full p-6 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[2rem] text-sm h-32 resize-none outline-none" 
                              placeholder="Nome das medicações, miligramas e horários..." 
                          />
                          <p className="flex items-center gap-1.5 text-[10px] text-emerald-600 mt-2 font-bold px-2">
                            <AlertCircle size={12}/> Verifique possíveis interações com anestésicos
                          </p>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                    <label className="text-[10px] font-black text-rose-500 uppercase block mb-4 tracking-widest">Alergias Medicamentosas:</label>
                    <Components.CheckboxGroup name="alergias_medicamentosas" label="" options={Constants.ALERGIAS} control={control} />
                    <div className="mt-6">
                      <input 
                          {...register("outras_alergias")} 
                          className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 py-2 outline-none text-sm font-bold placeholder-gray-300" 
                          placeholder="Alergia a metais, látex ou outros..." 
                      />
                    </div>
                </div>
            </div>
        </div>

        {/* 5. ESTILO DE VIDA (Hábitos & Vitalidade) */}
        <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 group transition-all">
            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest italic">
                <UserCircle size={20} className="text-gray-400 group-hover:text-emerald-500 transition-colors"/> Hábitos e Vitalidade
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="space-y-4">
                    <Components.CheckboxItem name="filtro_solar_diario" label="Usa Fotoprotetor Diário" register={register} />
                    <Components.CheckboxItem name="atividade_fisica" label="Atividade Física Regular" register={register} />
                    {praticaAtividade && (
                        <input 
                            {...register("atividade_fisica_detalhes")} 
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-medium animate-in zoom-in-95" 
                            placeholder="Qual atividade e frequência?" 
                        />
                    )}
                </div>

                <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-gray-700">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Ingestão Hídrica (L/Dia)</label>
                        <input {...register("ingestao_agua_qtd")} className="w-full p-2 border-b-2 border-blue-50 dark:border-blue-900 bg-transparent outline-none text-lg font-black" placeholder="0.0" />
                    </div>
                    <div className="space-y-1 pt-2">
                        <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Qualidade do Sono (Horas)</label>
                        <input {...register("sono_horas")} className="w-full p-2 border-b-2 border-purple-50 dark:border-purple-900 bg-transparent outline-none text-lg font-black" placeholder="0" />
                    </div>
                </div>

                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <Thermometer className="mx-auto text-emerald-500 mb-2" size={32}/>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase leading-relaxed px-4">
                      Hábitos saudáveis potencializam em até 40% os resultados de bioestimuladores.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}