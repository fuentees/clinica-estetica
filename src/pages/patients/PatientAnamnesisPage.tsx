import React, { useEffect, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Loader2, ArrowLeft, Save, HeartPulse,
  FileCheck, ClipboardList, AlertTriangle,
  Activity, Brain, BarChart3
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SignaturePad } from "../../components/SignaturePad"; 

// --- OPÇÕES FIXAS ---
const DOENCAS = ['Hipertensão', 'Diabetes', 'Cardiopatias', 'Autoimunes', 'Epilepsia', 'Tireoide'];
const ALERGIAS = ['Antibióticos', 'Anestésicos', 'Látex', 'Cosméticos', 'AAS/Dipirona', 'Frutos do Mar'];
const QUEIXAS = ['Gordura Localizada', 'Flacidez', 'Celulite', 'Melasma', 'Acne', 'Rugas', 'Cicatrizes', 'Estrias'];
const FOTOTIPOS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const BIOTIPOS = ['Normal', 'Seca', 'Oleosa', 'Mista', 'Sensível'];
const GRAUS_ESTETICOS = ['Nenhum', 'Leve', 'Moderado', 'Severo'];

const PROCEDIMENTOS_LISTA = [
    'Toxina Botulínica', 'Preenchimento', 'Bioestimulador', 'Fios de PDO',
    'Laser / Luz Pulsada', 'Peeling Químico', 'Microagulhamento', 'Cirurgia Plástica'
];

// helpers
const strToArray = (s: string | null | undefined) =>
  s ? s.split("; ").map(v => v.trim()).filter(Boolean) : [];

const arrayToStr = (a: any) => Array.isArray(a) ? a.join("; ") : a;

export function PatientAnamnesisPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // agora com aba "bio"
    const [activeTab, setActiveTab] = useState<"queixa" | "saude" | "fisico" | "bio" | "plano" | "termos">("queixa");
    const [patientName, setPatientName] = useState("");
    const [signatureData, setSignatureData] = useState(""); 

    const { register, handleSubmit, setValue, control, watch } = useForm();

    // Monitores
    const teveIntercorrencia = watch('teve_intercorrencia');
    const usaMedicacao = watch('usa_medicacao_continua');
    const peso = watch('peso');
    const altura = watch('altura');

    // Cálculo de IMC (com proteção pra altura 0)
    useEffect(() => {
        if (peso && altura) {
            const pesoNum = Number(peso);
            const alturaNum = Number(altura);
            if (alturaNum > 0) {
                const imcCalc = pesoNum / (alturaNum * alturaNum);
                if (!isNaN(imcCalc) && isFinite(imcCalc)) {
                    setValue('imc', imcCalc.toFixed(2));
                }
            }
        }
    }, [peso, altura, setValue]);

    useEffect(() => {
        if (id) fetchAnamnesis();
    }, [id]);

    async function fetchAnamnesis() {
        try {
            const { data, error } = await supabase.from('patients')
                .select(`*, profiles:profile_id(first_name, last_name)`)
                .eq('id', id).single();
            
            if (error) throw error;
            
            setPatientName(`${data.profiles?.first_name || ''} ${data.profiles?.last_name || ''}`.trim());

            // Arrays
            setValue('doencas_cronicas', strToArray(data.doencas_cronicas));
            setValue('alergias_medicamentosas', strToArray(data.alergias_medicamentosas));
            setValue('queixa_principal', strToArray(data.queixa_principal));
            setValue('procedimentos_previos', strToArray(data.procedimentos_previos));
            
            // Booleans
            [
             'gestante', 'lactante', 'uso_anticoncepcional', 'historico_queloide', 'tabagismo', 
             'uso_isotretinoina', 'termo_aceito', 'autoriza_foto', 'autoriza_midia', 
             'usa_medicacao_continua', 'uso_anticoagulante', 'uso_corticoide', 'uso_retinoide', 
             'alergia_anestesico', 'alergia_latex', 'expectativa_realista', 'pele_sensivel', 
             'tendencia_acne', 'melasma_manchas', 'implantes_metalicos'
            ].forEach(key => {
                // @ts-ignore
                setValue(key, Boolean(data[key]));
            });

            // Textos e Números
            [
             'observacoes_saude', 'objetivo_paciente', 'consumo_alcool', 'exposicao_solar', 
             'fototipo', 'biotipo_cutaneo', 'apto_status', 'outros_procedimentos', 'cirurgias_previas',
             'queixa_principal_detalhada', 'objetivo_especifico', 'tempo_queixa', 'fatores_agravantes', 
             'fatores_melhora', 'nivel_urgencia', 'evento_especifico', 'ultimo_procedimento_data', 
             'ultimo_procedimento_local', 'satisfacao_previas', 'outros_doencas', 'alergia_cosmeticos',
             'lista_medicacoes', 'diagnostico_sop', 'tabagismo_carga', 'frequencia_alcool', 'atividade_fisica',
             'sono_horas', 'ingestao_agua', 'estresse_nivel', 'peso', 'altura', 'imc', 'pressao_arterial',
             'cintura_cm', 'quadril_cm', 'class_glogau', 'grau_flacidez_facial', 'grau_celulite',
             'satisfacao_imagem_corporal', 'preferencia_plano', 'motivacao_principal', 'red_flags_profissional',
             'plano_inicial', 'prioridade_regioes', 'numero_sessoes_estimado', 'intervalo_sessoes',
             // --- NOVOS CAMPOS BIOIMPEDÂNCIA ---
             'bio_data', 'bio_equipamento', 'bio_responsavel',
             'bio_gordura_percentual', 'bio_massa_magra_percentual', 'bio_agua_percentual',
             'bio_gordura_visceral', 'bio_massa_muscular_kg', 'bio_massa_gorda_kg',
             'bio_massa_ossea_kg', 'bio_tmb', 'bio_idade_metabolica', 'bio_whr',
             'bio_observacoes'
            ].forEach(key => {
                // @ts-ignore
                setValue(key, data[key] ?? '');
            });

            // Intercorrência Lógica
            if (data.intercorrencias_previas && data.intercorrencias_previas.length > 3 && data.intercorrencias_previas !== 'Não') {
                setValue('teve_intercorrencia', true);
                setValue('intercorrencias_detalhes', data.intercorrencias_previas);
            } else {
                setValue('teve_intercorrencia', false);
            }

        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar anamnese.");
        } finally {
            setLoading(false);
        }
    }

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            let intercorrenciaFinal = "Não";
            if (data.teve_intercorrencia) {
                intercorrenciaFinal = data.intercorrencias_detalhes || "Sim, sem detalhes.";
            }

            // Tratamento de Arrays para String
            const payload = {
                ...data,
                doencas_cronicas: arrayToStr(data.doencas_cronicas),
                alergias_medicamentosas: arrayToStr(data.alergias_medicamentosas),
                queixa_principal: arrayToStr(data.queixa_principal),
                procedimentos_previos: arrayToStr(data.procedimentos_previos),
                intercorrencias_previas: intercorrenciaFinal,
            };
            
            // Limpeza de campos auxiliares
            delete payload.profiles;
            delete payload.teve_intercorrencia;
            delete payload.intercorrencias_detalhes;

            const { error } = await supabase.from('patients').update(payload).eq('id', id);
            if (error) throw error;
            
            if (signatureData) {
                console.log("Assinatura capturada, pronta para upload/salvamento:", signatureData);
            }

            toast.success("Anamnese salva com sucesso!");
            navigate(`/patients/${id}/history`);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-pink-600" />
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Anamnese Completa</h1>
                        <p className="text-sm text-gray-500">{patientName}</p>
                    </div>
                </div>
                <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-green-600 text-white shadow-lg">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Salvar
                </Button>
            </div>

            {/* Menu de Abas */}
            <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 overflow-x-auto">
                <TabButton active={activeTab === 'queixa'} onClick={() => setActiveTab('queixa')} icon={<ClipboardList size={18}/>} label="1. Queixa & Histórico" />
                <TabButton active={activeTab === 'saude'} onClick={() => setActiveTab('saude')} icon={<HeartPulse size={18}/>} label="2. Saúde Geral" />
                <TabButton active={activeTab === 'fisico'} onClick={() => setActiveTab('fisico')} icon={<Activity size={18}/>} label="3. Exame Físico" />
                <TabButton active={activeTab === 'bio'} onClick={() => setActiveTab('bio')} icon={<BarChart3 size={18}/>} label="4. Bioimpedância" />
                <TabButton active={activeTab === 'plano'} onClick={() => setActiveTab('plano')} icon={<Brain size={18}/>} label="5. Diagnóstico & Plano" />
                <TabButton active={activeTab === 'termos'} onClick={() => setActiveTab('termos')} icon={<FileCheck size={18}/>} label="6. Termos" />
            </div>

            <form className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px]">
                
                {/* --- ABA 1: QUEIXA & HISTÓRICO --- */}
                <div className={activeTab === 'queixa' ? 'block' : 'hidden'}>
                    <Section title="Queixa Principal & Objetivos">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="O que mais incomoda hoje?">
                                <textarea
                                  {...register("queixa_principal_detalhada")}
                                  className="input-area h-40"
                                  placeholder="Descreva detalhadamente..."
                                />
                            </Field>
                            <Field label="Qual resultado gostaria de alcançar?">
                                <textarea
                                  {...register("objetivo_especifico")}
                                  className="input-area h-40"
                                  placeholder="Ex: Rosto mais fino..."
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <InputWithLabel label="Há quanto tempo?" {...register("tempo_queixa")} />
                            <InputWithLabel label="Fatores de Piora" {...register("fatores_agravantes")} />
                            <InputWithLabel label="Fatores de Melhora" {...register("fatores_melhora")} />
                            <InputWithLabel label="Evento Específico" {...register("evento_especifico")} placeholder="Data limite" />
                        </div>
                        <div className="mt-4">
                            <LabelSlider label="Urgência (1-5)" name="nivel_urgencia" register={register} min="1" max="5" low="Baixa" high="Alta" />
                        </div>
                    </Section>

                    <Section title="Histórico Estético" className="mt-8">
                        <div className="mb-6">
                             <CheckboxGroup name="procedimentos_previos" label="Já realizou:" options={PROCEDIMENTOS_LISTA} control={control} />
                             <div className="mt-2">
                                <InputWithLabel label="Outros procedimentos" {...register("outros_procedimentos")} />
                             </div>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-800/30 mt-4">
                            <label className="font-bold text-red-600 flex items-center gap-2 mb-2">
                                <AlertTriangle size={16}/> Intercorrências Prévias?
                            </label>
                            <div className="flex gap-6 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="nao"
                                      {...register("teve_intercorrencia")}
                                      onChange={() => setValue('teve_intercorrencia', false)}
                                      checked={teveIntercorrencia === false}
                                      className="w-4 h-4 text-pink-600"
                                    />
                                    <span>Não</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="sim"
                                      {...register("teve_intercorrencia")}
                                      onChange={() => setValue('teve_intercorrencia', true)}
                                      checked={teveIntercorrencia === true}
                                      className="w-4 h-4 text-pink-600"
                                    />
                                    <span className="font-bold text-red-600">Sim</span>
                                </label>
                            </div>
                            {teveIntercorrencia && (
                                <textarea
                                  {...register("intercorrencias_detalhes")}
                                  className="w-full p-2 border border-red-300 rounded-md h-32 dark:bg-gray-800"
                                  placeholder="Descreva a complicação..."
                                />
                            )}
                        </div>
                    </Section>
                </div>

                {/* --- ABA 2: SAÚDE GERAL --- */}
                <div className={activeTab === 'saude' ? 'block' : 'hidden'}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <Section title="Doenças Crônicas">
                            <CheckboxGroup name="doencas_cronicas" label="Checklist" options={DOENCAS} control={control} />
                            <div className="mt-4"><InputWithLabel label="Outras" {...register("outros_doencas")} /></div>
                        </Section>
                        <Section title="Alergias">
                            <CheckboxGroup name="alergias_medicamentosas" label="Conhecidas" options={ALERGIAS} control={control} />
                            <div className="mt-4"><InputWithLabel label="Outras Alergias" {...register("alergia_cosmeticos")} /></div>
                        </Section>
                    </div>

                    <Section title="Medicamentos e Riscos" className="mt-8">
                        <div className="flex items-center gap-4 mb-4">
                             <label className="flex items-center gap-2 font-bold cursor-pointer">
                                <input type="checkbox" {...register("usa_medicacao_continua")} className="w-5 h-5 text-blue-600 rounded" />
                                Usa medicação contínua?
                             </label>
                        </div>
                        {usaMedicacao && (
                          <textarea
                            {...register("lista_medicacoes")}
                            className="input-area h-32 animate-in fade-in"
                            placeholder="Nome e dose..."
                          />
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                            <Check name="uso_anticoagulante" label="Anticoagulante?" register={register} />
                            <Check name="uso_corticoide" label="Corticoide?" register={register} />
                            <Check name="uso_retinoide" label="Roacutan?" register={register} />
                            <Check name="implantes_metalicos" label="Implantes Metálicos?" register={register} />
                        </div>
                    </Section>

                    <Section title="Ginecológica" className="mt-8">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Check name="gestante" label="Gestante?" register={register} />
                            <Check name="lactante" label="Lactante?" register={register} />
                            <Check name="uso_anticoncepcional" label="Anticoncepcional?" register={register} />
                         </div>
                         <div className="mt-4">
                            <InputWithLabel label="Diagnósticos (SOP...)" {...register("diagnostico_sop")} />
                         </div>
                    </Section>
                </div>

                {/* --- ABA 3: EXAME FÍSICO --- */}
                <div className={activeTab === 'fisico' ? 'block' : 'hidden'}>
                    <Section title="Análise de Pele">
                        <div className="grid md:grid-cols-3 gap-6">
                             <SelectField label="Fototipo" name="fototipo" register={register} options={FOTOTIPOS} />
                             <SelectField label="Biotipo" name="biotipo_cutaneo" register={register} options={BIOTIPOS} />
                             <SelectField label="Glogau" name="class_glogau" register={register} options={['I', 'II', 'III', 'IV']} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                            <SelectField label="Flacidez Facial" name="grau_flacidez_facial" register={register} options={GRAUS_ESTETICOS} />
                            <SelectField label="Celulite" name="grau_celulite" register={register} options={GRAUS_ESTETICOS} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t dark:border-gray-700">
                             <Check name="pele_sensivel" label="Sensível" register={register} />
                             <Check name="tendencia_acne" label="Acneica" register={register} />
                             <Check name="melasma_manchas" label="Melasma" register={register} />
                             <Check name="historico_queloide" label="Quelóide" register={register} />
                        </div>
                    </Section>

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                        <Section title="Hábitos">
                            <div className="grid grid-cols-2 gap-4">
                                <InputWithLabel label="Sono (hrs)" type="number" {...register("sono_horas")} />
                                <InputWithLabel label="Água (L)" type="number" step="0.1" {...register("ingestao_agua")} />
                            </div>
                            <div className="mt-4 space-y-4">
                                <InputWithLabel label="Tabagismo" {...register("tabagismo_carga")} placeholder="Carga/dia" />
                                <InputWithLabel label="Álcool" {...register("frequencia_alcool")} />
                                <InputWithLabel label="Atividade Física" {...register("atividade_fisica")} />
                            </div>
                            <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                <LabelSlider label="Estresse (1-5)" name="estresse_nivel" register={register} min="1" max="5" low="Zen" high="Alto" />
                            </div>
                        </Section>

                        <Section title="Medidas">
                            <div className="grid grid-cols-2 gap-4">
                                <InputWithLabel label="Peso (kg)" type="number" step="0.1" {...register("peso")} />
                                <InputWithLabel label="Altura (m)" type="number" step="0.01" {...register("altura")} />
                                <div>
                                    <label className="label">IMC</label>
                                    <Input readOnly {...register("imc")} className="bg-gray-100" />
                                </div>
                                <InputWithLabel label="PA" {...register("pressao_arterial")} placeholder="12/8" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                                <InputWithLabel label="Cintura (cm)" type="number" {...register("cintura_cm")} />
                                <InputWithLabel label="Quadril (cm)" type="number" {...register("quadril_cm")} />
                            </div>
                        </Section>
                    </div>
                </div>

                {/* --- ABA 4: BIOIMPEDÂNCIA --- */}
                <div className={activeTab === 'bio' ? 'block' : 'hidden'}>
                    <Section title="Bioimpedância Corporal">
                        <div className="grid md:grid-cols-3 gap-6">
                            <InputWithLabel label="Data da Avaliação" type="date" {...register("bio_data")} />
                            <InputWithLabel label="Equipamento" {...register("bio_equipamento")} />
                            <InputWithLabel label="Responsável" {...register("bio_responsavel")} />
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mt-6">
                            <InputWithLabel label="% Gordura Corporal" type="number" step="0.1" {...register("bio_gordura_percentual")} />
                            <InputWithLabel label="% Massa Magra" type="number" step="0.1" {...register("bio_massa_magra_percentual")} />
                            <InputWithLabel label="% Água Corporal" type="number" step="0.1" {...register("bio_agua_percentual")} />
                            <InputWithLabel label="Gordura Visceral (nível)" type="number" step="1" {...register("bio_gordura_visceral")} />
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <InputWithLabel label="Massa Muscular (kg)" type="number" step="0.1" {...register("bio_massa_muscular_kg")} />
                            <InputWithLabel label="Massa Gorda (kg)" type="number" step="0.1" {...register("bio_massa_gorda_kg")} />
                            <InputWithLabel label="Massa Óssea (kg)" type="number" step="0.1" {...register("bio_massa_ossea_kg")} />
                            <InputWithLabel label="TMB (kcal)" type="number" step="1" {...register("bio_tmb")} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                            <InputWithLabel label="Idade Metabólica (anos)" type="number" step="1" {...register("bio_idade_metabolica")} />
                            <InputWithLabel label="Relação Cintura/Quadril (WHR)" type="number" step="0.01" {...register("bio_whr")} />
                        </div>

                        <div className="mt-6">
                            <Field label="Observações / Interpretação">
                                <textarea
                                  {...register("bio_observacoes")}
                                  className="input-area h-40"
                                  placeholder="Resumo da interpretação, pontos de alerta, evolução em relação a avaliações anteriores..."
                                />
                            </Field>
                        </div>
                    </Section>
                </div>

                {/* --- ABA 5: DIAGNÓSTICO --- */}
                <div className={activeTab === 'plano' ? 'block' : 'hidden'}>
                    <Section title="Perfil e Expectativa">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <LabelSlider
                                label="Satisfação Corporal (0-10)"
                                name="satisfacao_imagem_corporal"
                                register={register}
                                min="0"
                                max="10"
                                low="Baixa"
                                high="Alta"
                              />
                            </div>
                            <div className="space-y-2">
                                <label className="label">Preferência de Plano</label>
                                <select {...register("preferencia_plano")} className="input-select">
                                    <option value="">Selecione</option>
                                    <option value="Rapido">Rápido/Intenso</option>
                                    <option value="Gradual">Gradual/Suave</option>
                                    <option value="Indefinido">A critério</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                          <InputWithLabel label="Motivação Principal" {...register("motivacao_principal")} />
                        </div>
                    </Section>

                    <Section title="Plano Terapêutico" className="mt-8 border-l-4 border-green-500">
                        <Field label="Resumo do Plano">
                            <textarea
                              {...register("plano_inicial")}
                              className="input-area h-40"
                              placeholder="Descreva as etapas..."
                            />
                        </Field>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <InputWithLabel label="Regiões Prioritárias" {...register("prioridade_regioes")} />
                            <InputWithLabel label="Sessões Estimadas" type="number" {...register("numero_sessoes_estimado")} />
                            <InputWithLabel label="Intervalo" {...register("intervalo_sessoes")} />
                        </div>
                    </Section>
                </div>

                {/* --- ABA 6: TERMOS --- */}
                <div className={activeTab === 'termos' ? 'block' : 'hidden'}>
                    <div className="max-w-2xl mx-auto text-center space-y-8 py-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-left">
                            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4">Checklist de Documentação</h3>
                            <div className="space-y-4">
                                <Check name="termo_aceito" label="TCLE Assinado" register={register} />
                                <Check name="autoriza_foto" label="Autoriza Fotos Prontuário" register={register} />
                                <Check name="autoriza_midia" label="Autoriza Fotos Redes Sociais (Anonimizado)" register={register} />
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t dark:border-gray-700">
                             <label className="block text-lg font-bold mb-4">Parecer Final de Aptidão</label>
                             <select {...register("apto_status")} className="w-full p-4 text-xl border-2 border-blue-200 rounded-xl text-center font-bold dark:bg-gray-900">
                                <option value="Apto">✅ APTO</option>
                                <option value="Apto com ressalvas">⚠️ COM RESSALVAS</option>
                                <option value="Não apto">🚫 NÃO APTO</option>
                            </select>
                        </div>

                        <div className="mt-8 text-left">
                             <label className="label-bold mb-2 block">Assinatura do Paciente</label>
                             <SignaturePad onEnd={(data) => setSignatureData(data)} isLoading={saving} />
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}

// --- COMPONENTES VISUAIS ---
const Section = ({ title, children, className="" }: any) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden ${className}`}>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 border-b pb-2">{title}</h2>
        {children}
    </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all whitespace-nowrap ${
        active ? 'bg-pink-50 text-pink-600 font-bold border border-pink-200' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
        {icon} <span className="hidden md:inline">{label}</span>
    </button>
);

const InputWithLabel = React.forwardRef(({ label, ...props }: any, ref) => (
    <div className="w-full">
        <label className="label">{label}</label>
        <Input {...props} ref={ref} />
    </div>
));

const Field = ({ label, children }: any) => (
    <div className="w-full">
      <label className="label">{label}</label>
      {children}
    </div>
);

const CheckboxGroup = ({ name, label, options, control }: any) => {
    const { field } = useController({ name, control, defaultValue: [] });
    return (
        <div>
            <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">{label}</h4>
            <div className="grid grid-cols-2 gap-3">
                {options.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          value={opt}
                          checked={field.value?.includes(opt)}
                          onChange={e => {
                              const val = e.target.value;
                              const curr = field.value || [];
                              field.onChange(
                                e.target.checked
                                  ? [...curr, val]
                                  : curr.filter((v: any) => v !== val)
                              );
                          }}
                          className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                        />
                        {opt}
                    </label>
                ))}
            </div>
        </div>
    );
};

const Check = ({ name, label, register }: any) => (
    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md">
        <input type="checkbox" {...register(name)} className="rounded text-pink-600 focus:ring-pink-500 w-5 h-5" />
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </label>
);

const SelectField = ({ label, name, register, options }: any) => (
    <div className="w-full">
        <label className="label">{label}</label>
        <select {...register(name)} className="input-select">
            <option value="">Selecione</option>
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

const LabelSlider = ({ label, name, register, min, max, low, high }: any) => (
    <div className="w-full">
        <label className="label mb-2 flex justify-between"><span>{label}</span></label>
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{low}</span>
            <input
              type="range"
              min={min}
              max={max}
              {...register(name)}
              className="w-full accent-pink-600 cursor-pointer"
            />
            <span className="text-xs text-gray-400">{high}</span>
        </div>
    </div>
);

// CSS (Tailwind)
// .label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
// .input-area { @apply w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-pink-500 outline-none; }
// .input-select { @apply w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none; }
// .label-bold { @apply block text-sm font-bold mb-1; }
