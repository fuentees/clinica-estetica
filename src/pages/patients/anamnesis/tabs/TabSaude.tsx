import { useFormContext, useWatch } from "react-hook-form";
import { 
  Activity, ShieldAlert, Pill, History, 
  Sun, HeartPulse, Thermometer, UserCircle 
} from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

export function TabSaude() {
  const { register, control } = useFormContext();
  
  // Observando os Checkboxes para mostrar os campos de detalhes apenas quando marcado
  const usaMedicacao = useWatch({ name: "usa_medicacao_continua", control });
  const fezCirurgia = useWatch({ name: "ja_fez_cirurgia", control });
  const praticaAtividade = useWatch({ name: "atividade_fisica", control });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. ALERTAS CRÍTICOS (Contraindicações) */}
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ShieldAlert size={150} className="text-red-900"/>
            </div>
            
            <h4 className="text-red-900 font-bold text-lg mb-6 flex items-center gap-2 relative z-10">
                <Activity className="text-red-600"/> Fatores de Risco & Contraindicações
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <Components.CheckboxItem name="gestante" label="Gestante" register={register} />
                <Components.CheckboxItem name="lactante" label="Lactante" register={register} />
                <Components.CheckboxItem name="marca_passo" label="Marcapasso" register={register} />
                <Components.CheckboxItem name="uso_anticoagulante" label="Anticoagulante" register={register} />
                <Components.CheckboxItem name="uso_retinoide" label="Uso de Roacutan" register={register} />
                <Components.CheckboxItem name="historico_queloide" label="Histórico de Quelóide" register={register} />
                <Components.CheckboxItem name="implantes_metalicos" label="Implantes Metálicos" register={register} />
                <Components.CheckboxItem name="fumante" label="Tabagista" register={register} />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. SAÚDE SISTÊMICA (Seleção Rápida de Patologias) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <HeartPulse size={20} className="text-blue-500"/> Saúde Sistêmica
                </h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Components.CheckboxItem name="possui_diabetes" label="Diabetes" register={register} />
                        <Components.CheckboxItem name="possui_hipertensao" label="Hipertensão" register={register} />
                        <Components.CheckboxItem name="alteracoes_hormonais" label="Tireoide/Hormonal" register={register} />
                        <Components.CheckboxItem name="doenca_hepatica" label="Hepatite/Hepática" register={register} />
                    </div>
                    
                    <div className="pt-6 border-t border-gray-50">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-4 block">
                            Outras Condições
                        </label>
                        <Components.CheckboxGroup name="doencas_cronicas" label="" options={Constants.DOENCAS} control={control} />
                        
                        <div className="mt-4">
                            <input 
                                {...register("outras_patologias_descricao")} 
                                className="w-full p-2 border-b border-gray-100 outline-none text-sm italic focus:border-blue-400 transition-colors" 
                                placeholder="Mais detalhes ou outra doença..." 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. ANÁLISE CUTÂNEA (Seleção Rápida de Pele) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Thermometer size={20} className="text-orange-500"/> Pele e Patologias
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Patologias:</label>
                        <Components.CheckboxGroup name="patologias_pele" label="" options={Constants.PATOLOGIAS_PELE} control={control} />
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Alterações Pigmentares:</label>
                        <Components.CheckboxGroup name="discromias" label="" options={Constants.DISCROMIAS} control={control} />
                    </div>
                </div>
            </div>

            {/* 4. HISTÓRICO E CIRURGIAS */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 to-indigo-500"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <History size={20} className="text-purple-500"/> Histórico
                </h3>
                
                <div className="space-y-4">
                    <Components.CheckboxItem name="ja_fez_cirurgia" label="Já realizou cirurgias?" register={register} />
                    
                    {fezCirurgia && (
                        <textarea 
                            {...register("detalhes_cirurgia")} 
                            className="w-full p-3 bg-gray-50 border-0 rounded-xl text-sm h-20 resize-none animate-in slide-in-from-top-2 duration-300" 
                            placeholder="Descreva as cirurgias e datas..." 
                        />
                    )}
                    
                    <div className="pt-4 border-t border-gray-50">
                        <Components.CheckboxGroup 
                            name="procedimentos_previos" 
                            label="Procedimentos estéticos anteriores:" 
                            options={Constants.HISTORICO_PROCEDIMENTOS} 
                            control={control} 
                        />
                    </div>
                </div>
            </div>

            {/* 5. ESTILO DE VIDA (Hábitos) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-emerald-600"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <UserCircle size={20} className="text-emerald-500"/> Estilo de Vida
                </h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <Components.CheckboxItem name="filtro_solar_diario" label="Usa Filtro Solar Diariamente" register={register} />
                        <Components.CheckboxItem name="atividade_fisica" label="Pratica Atividade Física Regular" register={register} />
                    </div>

                    {praticaAtividade && (
                        <input 
                            {...register("atividade_fisica_detalhes")} 
                            className="w-full p-2 bg-green-50/50 border-b border-green-100 outline-none text-sm animate-in slide-in-from-top-2" 
                            placeholder="Qual atividade e frequência?" 
                        />
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Água (Litros/Dia)</label>
                            <input {...register("ingestao_agua_qtd")} className="w-full p-2 border-b border-gray-100 outline-none text-sm" placeholder="Ex: 2.5" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Sono (Horas/Noite)</label>
                            <input {...register("sono_horas")} className="w-full p-2 border-b border-gray-100 outline-none text-sm" placeholder="Ex: 8" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 6. MEDICAMENTOS & ALERGIAS */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Pill className="text-green-500"/> Medicações & Alergias
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Components.CheckboxItem name="usa_medicacao_continua" label="Usa medicação contínua?" register={register} />
                    
                    {usaMedicacao && (
                        <textarea 
                            {...register("lista_medicacoes")} 
                            className="w-full p-4 bg-green-50/50 border-0 rounded-2xl text-sm resize-none h-24 animate-in slide-in-from-top-2" 
                            placeholder="Quais medicamentos e dosagens?" 
                        />
                    )}
                </div>
                <div>
                    <label className="font-bold text-xs text-gray-500 uppercase block mb-4 italic">Alergias Conhecidas:</label>
                    <Components.CheckboxGroup name="alergias_medicamentosas" label="" options={Constants.ALERGIAS} control={control} />
                    <input 
                        {...register("outras_alergias")} 
                        className="w-full mt-4 p-2 border-b border-gray-100 outline-none text-sm italic" 
                        placeholder="Outras alergias específicas..." 
                    />
                </div>
            </div>
        </div>
    </div>
  );
}