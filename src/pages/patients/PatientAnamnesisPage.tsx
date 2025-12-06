import React, { useEffect, useRef, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  User,
  FileText,
  X,
  ClipboardList,
  Heart,
  Smile,
  CheckSquare,
  Loader2,
  CheckCircle, 
  MapPin,
  Calendar,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from "lucide-react";

// 🔹 IMPORT REAL DO SUPABASE
import { supabase } from "../../lib/supabase"; 
// 🔹 IMPORT DO SLIDER
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";

// ============================================================================
// 1. UTILS
// ============================================================================

const strToArray = (s: string | null | undefined) => s ? s.split("; ").map((v) => v.trim()).filter(Boolean) : [];
const arrayToStr = (a: any) => (Array.isArray(a) ? a.join("; ") : a);

const toNumOrNull = (val: any) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

// ============================================================================
// 2. COMPONENTES UI (VERMELHO)
// ============================================================================

function Button({ className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'outline' | 'danger' }) {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "hover:bg-red-50 dark:hover:bg-gray-800 hover:text-red-900 dark:hover:text-white",
    outline: "border border-gray-300 bg-transparent hover:bg-red-50 dark:hover:bg-gray-800",
    danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50"
  };
  // @ts-ignore
  return <button className={`${baseStyles} ${variants[variant]} h-10 px-4 py-2 ${className || ''}`} {...props} />;
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

function Section({ title, children, className = "" }: any) {
  return (
    <div className={`p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-8 ${className}`}>
      <div className="mb-4 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border-l-4 border-red-600">
        <h2 className="text-lg font-bold text-red-800 dark:text-red-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={(e) => { e.preventDefault(); onClick(); }} 
      className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all whitespace-nowrap ${active ? "bg-red-50 text-red-700 font-bold border border-red-300 shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"}`}
    >
      {icon} <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function InputWithLabelComponent({ label, ...props }: any, ref: any) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <Input {...props} ref={ref} />
    </div>
  );
}
const InputWithLabel = React.forwardRef(InputWithLabelComponent);

function Field({ label, children }: any) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ProcedureListWithDates({ control, register, setValue }: any) {
  const { field } = useController({ name: "procedimentos_previos", control, defaultValue: [] });
  const selectedProcedures = field.value || [];

  const handleCheck = (proc: string, checked: boolean) => {
    if (checked) {
      field.onChange([...selectedProcedures, proc]);
    } else {
      field.onChange(selectedProcedures.filter((p: string) => p !== proc));
      setValue(`data_proc_${proc}`, ""); 
    }
  };

  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">Procedimentos Realizados:</h4>
      <div className="space-y-3">
        {PROCEDIMENTOS_LISTA.map((proc) => {
          const isChecked = selectedProcedures.includes(proc);
          return (
            <div key={proc} className={`p-3 rounded-lg border transition-all ${isChecked ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheck(proc, e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-5 h-5"
                  />
                  <span className={`font-medium ${isChecked ? "text-red-800" : "text-gray-700"}`}>{proc}</span>
                </label>
                {isChecked && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-xs text-red-700 flex items-center gap-1 font-bold">
                      <Calendar size={12} /> Última sessão:
                    </span>
                    <input 
                      type="date" 
                      {...register(`data_proc_${proc}`)}
                      className="text-sm p-1 border rounded bg-white text-gray-600 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxGroup({ name, label, options, control }: any) {
  const { field } = useController({ name, control, defaultValue: [] });
  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">{label}</h4>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60 p-1 rounded">
            <input 
              type="checkbox" 
              value={opt} 
              checked={field.value?.includes(opt)} 
              onChange={(e) => { 
                const val = e.target.value; 
                const curr = field.value || []; 
                field.onChange(e.target.checked ? [...curr, val] : curr.filter((v: any) => v !== val)); 
              }} 
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4" 
            /> 
            <span className="text-gray-700 dark:text-gray-300">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RegionGrid({ name, options, control }: any) {
  const { field } = useController({ name, control, defaultValue: [] });
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => {
          const isSelected = field.value?.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const curr = field.value || [];
                field.onChange(isSelected ? curr.filter((v: any) => v !== opt) : [...curr, opt]);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                isSelected 
                  ? "bg-red-100 border-red-500 text-red-800 font-bold shadow-sm" 
                  : "bg-white border-gray-300 text-gray-600 hover:border-red-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxItem({ name, label, register }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-md">
      <input type="checkbox" {...register(name)} className="rounded text-red-600 focus:ring-red-500 w-5 h-5" />
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

function SelectField({ label, name, register, options }: any) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select {...register(name)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-red-500 outline-none">
        <option value="">Selecione</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function LabelSlider({ label, name, register, min, max, low, high }: any) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between"><span>{label}</span></label>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{low}</span>
        <input type="range" min={min} max={max} {...register(name)} className="w-full accent-red-600 cursor-pointer" />
        <span className="text-xs text-gray-400">{high}</span>
      </div>
    </div>
  );
}

function YesNoRadio({ label, name, register, watchValue, trueLabel = "Sim", falseLabel = "Não" }: any) {
  const isTrue = watchValue === "true" || watchValue === true;
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="true" {...register(name)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
          <span className={isTrue ? "font-bold text-red-700" : "text-gray-700 dark:text-gray-300"}>{trueLabel}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="false" {...register(name)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
          <span className={!isTrue && watchValue !== undefined ? "font-bold text-gray-900" : "text-gray-700 dark:text-gray-300"}>{falseLabel}</span>
        </label>
      </div>
    </div>
  );
}

function SignaturePad({ 
  onEnd, 
  existingSignature, 
  isLoading 
}: { 
  onEnd: (data: string) => void;
  existingSignature: string | null;
  isLoading?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    if (hasSignature || isLoading) return; 
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || hasSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      onEnd(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const clear = (e: any) => {
    e.preventDefault();
    if(isLoading) return;
    setHasSignature(false);
    onEnd(""); 
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (hasSignature && existingSignature) {
      return (
          <div className="border-2 border-dashed border-green-300 rounded-xl bg-green-50 p-4 text-center">
              <img src={existingSignature} alt="Assinatura Salva" className="mx-auto max-h-[150px] mb-2" />
              <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-2">
                  <CheckCircle size={16} /> Assinatura Registrada
              </div>
              <button type="button" onClick={clear} disabled={!!isLoading} className="text-red-600 hover:underline text-sm flex items-center justify-center gap-1 mx-auto disabled:opacity-50">
                  <X size={14} /> Apagar e Assinar Novamente
              </button>
          </div>
      )
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="bg-white rounded-lg mx-auto touch-none cursor-crosshair max-w-full border border-gray-200"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="mt-2 flex justify-center gap-4 text-sm text-gray-500">
        <span>Assine acima com o dedo ou mouse</span>
        <button type="button" onClick={clear} disabled={!!isLoading} className="text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50">
          <X size={14} /> Limpar
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. DADOS ESTÁTICOS
// ============================================================================

const DOENCAS = ["Hipertensão", "Diabetes", "Cardiopatias", "Autoimunes", "Epilepsia", "Tireoide"];
const ALERGIAS = ["Antibióticos", "Anestésicos", "Látex", "Cosméticos", "AAS/Dipirona", "Frutos do Mar"];
const QUEIXAS = ["Gordura Localizada", "Flacidez", "Celulite", "Melasma", "Acne", "Rugas", "Cicatrizes", "Estrias"];
const FOTOTIPOS = ["I", "II", "III", "IV", "V", "VI"];
const BIOTIPOS = ["Normal", "Seca", "Oleosa", "Mista", "Sensível"];
const TEXTURAS_PELE = ["Lisa", "Áspera"];
const GRAUS_ACNE = ["Grau I", "Grau II", "Grau III", "Grau IV"];
const LESOES_ACNE = ["Comedões", "Foliculite", "Pápulas", "Pústulas", "Milium", "Cistos", "Nódulo", "Placa", "Vesícula", "Abcesso"];
const PATOLOGIAS_PELE = ["Rosácea", "Dermatite Seborreica", "Dermatite de Contato", "Dermatite Atópica"];
const DISCROMIAS = ["Acromia", "Hipocromia", "Hipercromia"];
const ENVELHECIMENTO_SINAIS = ["Rugas Dinâmicas", "Rugas Estáticas", "Elastose", "Flacidez Muscular", "Flacidez Tissular"];
const ALTERACOES_POSTURAIS = ["Cifose", "Escoliose", "Hiperlordose"];
const TIPOS_LIPODISTROFIA = ["Flácida", "Compacta", "Edematosa"];
const TIPOS_ESTRIAS = ["Vermelhas", "Nacaradas", "Brancas"];
const FLACIDEZ_CORPORAL = ["Tissular", "Muscular"];
const PROCEDIMENTOS_LISTA = ["Toxina Botulínica", "Preenchimento", "Bioestimulador", "Fios de PDO", "Laser / Luz Pulsada", "Peeling Químico", "Microagulhamento", "Cirurgia Plástica"];

const REGIOES_FACIAIS = ["Frontal (Testa)", "Glabela", "Periorbital (Olhos)", "Malar (Maçãs)", "Nasal", "Nasogeniano (Bigode Chinês)", "Perioral (Boca)", "Mentual (Queixo)", "Mandibular", "Pescoço", "Colo"];
const REGIOES_CORPORAIS = ["Braços", "Abdômen Sup.", "Abdômen Inf.", "Flancos", "Costas", "Glúteos", "Coxa Anterior", "Coxa Posterior", "Interno Coxa", "Culote", "Panturrilha"];

const TERMO_LGPD_COMPLETO = `
Eu, paciente identificado no prontuário desta clínica, declaro que fui devidamente informado(a), de forma clara, adequada e suficiente, sobre a necessidade de realização de registros fotográficos e/ou audiovisuais, antes, durante e após procedimentos estéticos, exclusivamente para fins de avaliação, acompanhamento clínico, registro técnico e documentação da evolução do tratamento ao qual serei submetido(a).

Autorizo, de maneira livre, informada e inequívoca, que minhas imagens sejam captadas, armazenadas, tratadas e utilizadas pela clínica e por seus profissionais, para compor meu prontuário, subsidiar decisões terapêuticas, permitir comparações entre estágios de tratamento, registrar intercorrências, dar suporte à conduta técnica adotada, e eventualmente servir como documento de comprovação em auditorias internas, demandas profissionais, perícias ou processos éticos, caso necessário. Declaro estar ciente de que tais imagens possuem caráter estritamente técnico e que têm como finalidade principal a garantia de segurança, transparência, rastreabilidade e qualidade assistencial.

Autorizo ainda que as imagens possam ser utilizadas para fins de treinamento técnico da equipe, aprimoramento de protocolos internos, estudos comparativos, pesquisa clínica sem identificação direta e padronização de resultados, desde que meu nome e dados pessoais não sejam divulgados, em conformidade com o princípio da anonimização previsto na Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Fica vedada qualquer forma de comercialização, cessão ou compartilhamento das minhas imagens com terceiros que não tenham relação direta com o serviço prestado ou necessidade técnica comprovada.

Declaro estar ciente de que o uso externo das imagens, como divulgação em redes sociais, sites, materiais publicitários, folders, palestras, congressos ou quaisquer meios de comunicação, somente ocorrerá mediante minha autorização adicional e expressa, colhida separadamente no sistema. Tal autorização poderá abranger imagens anonimizadas ou parcialmente identificáveis, de acordo com minha escolha e ciência. Caso eu não concorde com a divulgação externa, nenhuma imagem será utilizada para esse fim.

Estou ciente de que todas as imagens serão armazenadas em ambiente seguro e que a clínica adotará medidas técnicas e administrativas compatíveis com a legislação vigente, visando impedir acessos não autorizados, vazamentos, perdas ou manipulações indevidas. Reconheço, porém, que mesmo diante das melhores práticas de segurança, nenhum sistema digital está completamente imune a riscos, e concordo que a clínica não poderá ser responsabilizada por eventos decorrentes de ataques cibernéticos ou atos de terceiros, desde que não haja negligência por parte da instituição.

Reconheço que posso, a qualquer momento, solicitar acesso às imagens, requerer correções, obter informações sobre o tratamento dos dados e revogar parcialmente esta autorização, respeitando-se a legalidade do uso anterior à revogação. Declaro compreender que a revogação não impede a clínica de manter as imagens no prontuário, por obrigação legal, ética, regulatória e sanitária, conforme prevê o Código de Ética e legislações correlatas.

Concordo que a clínica não se responsabiliza por interpretações equivocadas, expectativas irreais ou comparações feitas pelo próprio paciente com imagens externas, de terceiros ou manipuladas digitalmente. Reconheço que resultados estéticos podem variar conforme características individuais, e que imagens de outros pacientes não constituem garantia de resultado.

Por fim, autorizo o uso das imagens para fins internos e assistenciais, conforme descrito acima, e declaro que li atentamente todas as cláusulas deste termo, não restando dúvidas quanto ao seu conteúdo. Confirmo minha concordância mediante assinatura digital registrada no sistema, para que produza efeitos legais.
`;

// ============================================================================
// 4. COMPONENTE PRINCIPAL
// ============================================================================

export function PatientAnamnesisPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // Estado para o upload de foto
  const [showTermoModal, setShowTermoModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"queixa" | "saude" | "facial" | "corporal" | "plano" | "termos" | "fotos">("queixa");
  
  const [patientName, setPatientName] = useState("Carregando...");
  const [signatureData, setSignatureData] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  
  // Estado para armazenar as fotos carregadas
  const [patientPhotos, setPatientPhotos] = useState<string[]>([]);

  const { register, handleSubmit, setValue, reset, control, watch } = useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitores
  const teveIntercorrencia = watch("teve_intercorrencia");
  const usaMedicacao = watch("usa_medicacao_continua");
  const praticaAtividade = watch("pratica_atividade");
  const ingereAgua = watch("ingere_agua");
  const temTelangiectasias = watch("tem_telangiectasias");
  const peso = watch("peso");
  const altura = watch("altura");

  useEffect(() => {
    if (peso && altura) {
      const pesoNum = Number(peso);
      const alturaNum = Number(altura);
      if (alturaNum > 0) {
        const imcCalc = pesoNum / (alturaNum * alturaNum);
        if (!isNaN(imcCalc) && isFinite(imcCalc)) setValue("imc", imcCalc.toFixed(2));
      }
    }
  }, [peso, altura, setValue]);

  useEffect(() => {
    if (id) fetchAnamnesis();
  }, [id]);

  async function fetchAnamnesis() {
    try {
      if (!id) return;
      
      const { data, error } = await supabase.from("patients").select(`*, profiles:profile_id(first_name, last_name)`).eq("id", id).single();
      
      if (error) throw error;
      if (!data) return;

      // 🔴 FIX DO NOME: BUSCA ROBUSTA
      const nameFromTable = data.name || data.nome || data.full_name;
      // @ts-ignore
      const nameFromProfile = data.profiles ? `${data.profiles.first_name} ${data.profiles.last_name}` : null;
      setPatientName(nameFromTable || nameFromProfile || "Paciente Sem Nome");

      const formData: any = { ...data };

      // Arrays
      [
        "doencas_cronicas", "alergias_medicamentosas", "queixa_principal", "procedimentos_previos",
        "facial_lesoes", "facial_patologias", "facial_discromias", "facial_envelhecimento",
        "corporal_postura", "corporal_lipodistrofia", "corporal_estrias", "corporal_flacidez_tipo",
        "facial_telangiectasias_local", "facial_discromias_local", "facial_rugas_local",
        "corporal_gordura_local", "corporal_celulite_local", "corporal_estrias_local", "corporal_flacidez_local"
      ].forEach(key => {
        formData[key] = strToArray(data[key]);
      });

      // JSON Data & Assinatura & FOTOS
      const procDates = data.procedimentos_detalhes_json || {};
      if (typeof procDates === 'object') {
        Object.keys(procDates).forEach(key => {
           formData[key] = procDates[key];
        });
        
        if (procDates.assinatura_base64) {
            setSavedSignature(procDates.assinatura_base64);
            setSignatureData(procDates.assinatura_base64);
        }

        // 📸 CARREGAR FOTOS SALVAS
        if (procDates.galeria_fotos && Array.isArray(procDates.galeria_fotos)) {
            setPatientPhotos(procDates.galeria_fotos);
        }
      }

      formData.teve_intercorrencia = data.intercorrencias_previas && data.intercorrencias_previas !== "Não" ? "true" : "false";
      if (data.intercorrencias_previas && data.intercorrencias_previas !== "Não") {
          formData.intercorrencias_detalhes = data.intercorrencias_previas;
      }
      formData.pratica_atividade = data.pratica_atividade ? "true" : "false";
      formData.ingere_agua = data.ingere_agua ? "true" : "false";
      formData.tem_telangiectasias = data.tem_telangiectasias ? "true" : "false";

      reset(formData);

    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar anamnese.");
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DE UPLOAD ---
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !id) return;
    
    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    try {
        // 1. Upload para o Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('patient-photos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Obter URL Pública
        const { data: publicUrlData } = supabase.storage
            .from('patient-photos')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // 3. Atualizar o Array local e Salvar no Banco
        const newPhotos = [...patientPhotos, publicUrl];
        setPatientPhotos(newPhotos);

        // Salvar imediatamente no JSON do paciente
        // Precisamos buscar o JSON atual primeiro para não perder a assinatura
        const { data: currentData } = await supabase.from('patients').select('procedimentos_detalhes_json').eq('id', id).single();
        const currentJson = currentData?.procedimentos_detalhes_json || {};
        
        await supabase.from('patients').update({
            procedimentos_detalhes_json: { ...currentJson, galeria_fotos: newPhotos }
        }).eq('id', id);

        toast.success("Foto enviada com sucesso!");

    } catch (error: any) {
        console.error('Erro no upload:', error);
        toast.error("Erro ao enviar foto: " + error.message);
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Limpar input
    }
  };

  const deletePhoto = async (photoUrl: string) => {
      if(!confirm("Tem certeza que deseja remover esta foto?")) return;
      
      const newPhotos = patientPhotos.filter(p => p !== photoUrl);
      setPatientPhotos(newPhotos);

      // Atualizar banco
      const { data: currentData } = await supabase.from('patients').select('procedimentos_detalhes_json').eq('id', id).single();
      const currentJson = currentData?.procedimentos_detalhes_json || {};
      
      await supabase.from('patients').update({
          procedimentos_detalhes_json: { ...currentJson, galeria_fotos: newPhotos }
      }).eq('id', id);
      toast.success("Foto removida.");
  }


  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      let intercorrenciaFinal = "Não";
      if (data.teve_intercorrencia === "true" || data.teve_intercorrencia === true) {
        intercorrenciaFinal = data.intercorrencias_detalhes || "Sim, sem detalhes.";
      }

      const procedimentosDatas: any = {};
      PROCEDIMENTOS_LISTA.forEach(proc => {
         if(data[`data_proc_${proc}`]) {
            procedimentosDatas[`data_proc_${proc}`] = data[`data_proc_${proc}`];
         }
      });

      if (signatureData) procedimentosDatas.assinatura_base64 = signatureData;
      if (patientPhotos.length > 0) procedimentosDatas.galeria_fotos = patientPhotos;

      const payload = {
        ...data,
        doencas_cronicas: arrayToStr(data.doencas_cronicas),
        alergias_medicamentosas: arrayToStr(data.alergias_medicamentosas),
        queixa_principal: arrayToStr(data.queixa_principal),
        procedimentos_previos: arrayToStr(data.procedimentos_previos),
        facial_lesoes: arrayToStr(data.facial_lesoes),
        facial_patologias: arrayToStr(data.facial_patologias),
        facial_discromias: arrayToStr(data.facial_discromias),
        facial_envelhecimento: arrayToStr(data.facial_envelhecimento),
        corporal_postura: arrayToStr(data.corporal_postura),
        corporal_lipodistrofia: arrayToStr(data.corporal_lipodistrofia),
        corporal_estrias: arrayToStr(data.corporal_estrias),
        corporal_flacidez_tipo: arrayToStr(data.corporal_flacidez_tipo),
        facial_telangiectasias_local: arrayToStr(data.facial_telangiectasias_local),
        facial_discromias_local: arrayToStr(data.facial_discromias_local),
        facial_rugas_local: arrayToStr(data.facial_rugas_local),
        corporal_gordura_local: arrayToStr(data.corporal_gordura_local),
        corporal_celulite_local: arrayToStr(data.corporal_celulite_local),
        corporal_estrias_local: arrayToStr(data.corporal_estrias_local),
        corporal_flacidez_local: arrayToStr(data.corporal_flacidez_local),

        peso: toNumOrNull(data.peso),
        altura: toNumOrNull(data.altura),
        imc: toNumOrNull(data.imc),
        cintura_cm: toNumOrNull(data.cintura_cm),
        quadril_cm: toNumOrNull(data.quadril_cm),
        numero_sessoes_estimado: toNumOrNull(data.numero_sessoes_estimado),
        sono_horas: toNumOrNull(data.sono_horas),
        ingestao_agua_qtd: toNumOrNull(data.ingestao_agua_qtd),

        intercorrencias_previas: intercorrenciaFinal,
        pratica_atividade: data.pratica_atividade === "true",
        ingere_agua: data.ingere_agua === "true",
        tem_telangiectasias: data.tem_telangiectasias === "true",
        
        procedimentos_detalhes_json: procedimentosDatas
      };

      delete payload.profiles;
      delete payload.teve_intercorrencia;
      delete payload.intercorrencias_detalhes;

      await supabase.from("patients").update(payload).eq("id", id);
      
      if (signatureData) setSavedSignature(signatureData);

      toast.success("Rascunho salvo com sucesso!");

    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Anamnese Completa</h1>
            <p className="text-sm text-gray-500 font-bold">{patientName}</p>
          </div>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
          Salvar Rascunho
        </Button>
      </div>

      {/* Menu de Abas */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl mb-6 overflow-x-auto shadow-sm border border-gray-200 dark:border-gray-700">
        <TabButton active={activeTab === "queixa"} onClick={() => setActiveTab("queixa")} icon={<ClipboardList size={18} />} label="1. Queixa" />
        <TabButton active={activeTab === "saude"} onClick={() => setActiveTab("saude")} icon={<Heart size={18} />} label="2. Saúde" />
        <TabButton active={activeTab === "facial"} onClick={() => setActiveTab("facial")} icon={<Smile size={18} />} label="3. Facial" />
        <TabButton active={activeTab === "corporal"} onClick={() => setActiveTab("corporal")} icon={<User size={18} />} label="4. Corporal" />
        <TabButton active={activeTab === "plano"} onClick={() => setActiveTab("plano")} icon={<FileText size={18} />} label="5. Plano" />
        <TabButton active={activeTab === "termos"} onClick={() => setActiveTab("termos")} icon={<CheckSquare size={18} />} label="6. Termos" />
        <TabButton active={activeTab === "fotos"} onClick={() => setActiveTab("fotos")} icon={<Camera size={18} />} label="7. Fotos" />
      </div>

      <form className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[600px]">
        
        {/* ... ABAS 1-5 (CÓDIGO JÁ EXISTENTE MANTIDO) ... */}
        {/* --- ABA 1: QUEIXA --- */}
        <div className={activeTab === "queixa" ? "block" : "hidden"}>
          <Section title="Queixa Principal & Objetivos">
            <div className="space-y-8">
              <Field label="O que mais incomoda hoje?">
                <CheckboxGroup name="queixa_principal" label="Selecione as principais queixas:" options={QUEIXAS} control={control} />
                <div className="mt-4"><textarea {...register("queixa_principal_detalhada")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]" placeholder="Detalhamento da queixa..." /></div>
              </Field>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputWithLabel label="Há quanto tempo?" {...register("tempo_queixa")} />
                <InputWithLabel label="Fatores de Piora" {...register("fatores_agravantes")} />
                <InputWithLabel label="Fatores de Melhora" {...register("fatores_melhora")} />
                <InputWithLabel label="Evento Específico" {...register("evento_especifico")} />
              </div>
              <div className="mt-4"><LabelSlider label="Urgência (1-5)" name="nivel_urgencia" register={register} min="1" max="5" low="Baixa" high="Alta" /></div>
            </div>
          </Section>
          <Section title="Histórico Estético">
            <ProcedureListWithDates control={control} register={register} setValue={setValue} />
             <div className="mt-4"><InputWithLabel label="Outros Procedimentos / Detalhes" {...register("outros_procedimentos")} /></div>
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 mt-4">
              <YesNoRadio label="Já teve alguma intercorrência?" name="teve_intercorrencia" register={register} watchValue={teveIntercorrencia} />
              {(teveIntercorrencia === "true" || teveIntercorrencia === true) && (<textarea {...register("intercorrencias_detalhes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="Descreva a complicação..." />)}
            </div>
          </Section>
        </div>

        {/* --- ABA 2: SAÚDE GERAL --- */}
        <div className={activeTab === "saude" ? "block" : "hidden"}>
          <div className="grid md:grid-cols-2 gap-8">
            <Section title="Histórico Clínico" className="border-l-4 border-red-500">
              <CheckboxGroup name="doencas_cronicas" label="Doenças Crônicas:" options={DOENCAS} control={control} />
              <div className="mt-4"><InputWithLabel label="Outras doenças / Obs" {...register("outros_doencas")} /></div>
            </Section>
            <Section title="Alergias" className="border-l-4 border-red-500">
              <CheckboxGroup name="alergias_medicamentosas" label="Alergias:" options={ALERGIAS} control={control} />
              <div className="mt-4"><InputWithLabel label="Outras Alergias (Cosméticos/Alimentos)" {...register("alergia_cosmeticos")} /></div>
            </Section>
          </div>
          <Section title="Medicamentos e Hábitos">
            <div className="flex items-center gap-4 mb-4"><CheckboxItem name="usa_medicacao_continua" label="Usa medicação contínua?" register={register} /></div>
            {usaMedicacao && (<textarea {...register("lista_medicacoes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none h-20 mb-4" placeholder="Quais medicações?" />)}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t dark:border-gray-700">
               <CheckboxItem name="gestante" label="Gestante" register={register} />
               <CheckboxItem name="lactante" label="Lactante" register={register} />
               <CheckboxItem name="uso_anticoncepcional" label="Anticoncepcional" register={register} />
               <CheckboxItem name="fumante" label="Tabagismo" register={register} />
               <CheckboxItem name="uso_anticoagulante" label="Anticoagulante" register={register} />
               <CheckboxItem name="uso_retinoide" label="Roacutan" register={register} />
               <CheckboxItem name="implantes_metalicos" label="Implantes Metálicos" register={register} />
               <CheckboxItem name="historico_queloide" label="Quelóide" register={register} />
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-6 pt-6 border-t dark:border-gray-700">
               <div>
                  <YesNoRadio label="Pratica atividade física?" name="pratica_atividade" register={register} watchValue={praticaAtividade} />
                  {(praticaAtividade === "true" || praticaAtividade === true) && (<div className="bg-gray-50 p-4 rounded-md"><InputWithLabel label="Frequência (vezes/semana)" {...register("atividade_fisica_detalhes")} placeholder="Ex: 3x" /></div>)}
               </div>
               <div>
                  <YesNoRadio label="Ingestão de água adequada?" name="ingere_agua" register={register} watchValue={ingereAgua} />
                  {(ingereAgua === "true" || ingereAgua === true) && (<div className="bg-gray-50 p-4 rounded-md"><InputWithLabel label="Quantidade Aproximada (Litros/dia)" {...register("ingestao_agua_qtd")} type="number" step="0.1" /></div>)}
               </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-6"><InputWithLabel label="Sono (h/noite)" {...register("sono_horas")} type="number" /></div>
          </Section>
        </div>

        {/* --- ABA 3: FACIAL --- */}
        <div className={activeTab === "facial" ? "block" : "hidden"}>
           <Section title="Análise da Pele (Visual/Palpatória)">
             <div className="grid md:grid-cols-3 gap-6">
                <SelectField label="Biotipo Cutâneo" name="biotipo_cutaneo" register={register} options={BIOTIPOS} />
                <SelectField label="Fototipo" name="fototipo" register={register} options={FOTOTIPOS} />
                <SelectField label="Textura ao Toque" name="facial_textura" register={register} options={TEXTURAS_PELE} />
             </div>
             <div className="grid md:grid-cols-3 gap-6 mt-4">
                <SelectField label="Grau de Acne" name="facial_acne_grau" register={register} options={GRAUS_ACNE} />
                <SelectField label="Classificação de Glogau" name="class_glogau" register={register} options={["Tipo I", "Tipo II", "Tipo III", "Tipo IV"]} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sensibilidade?</label>
                  <div className="flex gap-4 mt-2"><CheckboxItem name="pele_sensivel" label="Sim" register={register} /><CheckboxItem name="rosacea" label="Rosácea" register={register} /></div>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t dark:border-gray-700"><CheckboxGroup name="facial_lesoes" label="Lesões Elementares (Acne/Outros):" options={LESOES_ACNE} control={control} /></div>
             <div className="mt-6 pt-6 border-t dark:border-gray-700"><CheckboxGroup name="facial_patologias" label="Patologias e Dermatites:" options={PATOLOGIAS_PELE} control={control} /></div>
             <div className="grid md:grid-cols-2 gap-8 mt-6 pt-6 border-t dark:border-gray-700">
                <div>
                   <h4 className="font-semibold mb-2">Vascularização</h4>
                   <YesNoRadio label="Possui Telangiectasias?" name="tem_telangiectasias" register={register} watchValue={temTelangiectasias} />
                   {(temTelangiectasias === "true" || temTelangiectasias === true) && (<div className="bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Região Acometida:</label><RegionGrid name="facial_telangiectasias_local" options={REGIOES_FACIAIS} control={control} /></div>)}
                </div>
                <div>
                   <h4 className="font-semibold mb-2">Discromias (Manchas)</h4>
                   <CheckboxGroup name="facial_discromias" label="Tipo:" options={DISCROMIAS} control={control} />
                   <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100"><label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Região das Manchas:</label><RegionGrid name="facial_discromias_local" options={REGIOES_FACIAIS} control={control} /></div>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h4 className="font-semibold mb-2">Sinais de Envelhecimento</h4>
                <CheckboxGroup name="facial_envelhecimento" label="Presença de:" options={ENVELHECIMENTO_SINAIS} control={control} />
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100"><label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Região das Rugas/Flacidez:</label><RegionGrid name="facial_rugas_local" options={REGIOES_FACIAIS} control={control} /></div>
             </div>
             <div className="mt-6"><Field label="Observações Faciais Gerais"><textarea {...register("facial_observacoes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="Anote aqui outras percepções da avaliação visual e palpatória..." /></Field></div>
           </Section>
        </div>

        {/* --- ABA 4: CORPORAL --- */}
        <div className={activeTab === "corporal" ? "block" : "hidden"}>
           <Section title="Medidas e Sinais Vitais">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <InputWithLabel label="Peso (kg)" type="number" step="0.1" {...register("peso")} />
                 <InputWithLabel label="Altura (m)" type="number" step="0.01" {...register("altura")} />
                 <InputWithLabel label="IMC" readOnly {...register("imc")} className="bg-gray-100 dark:bg-gray-700" />
                 <InputWithLabel label="PA" {...register("pressao_arterial")} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"><InputWithLabel label="Cintura (cm)" type="number" {...register("cintura_cm")} /><InputWithLabel label="Quadril (cm)" type="number" {...register("quadril_cm")} /></div>
           </Section>
           <Section title="Análise Corporal (Visual/Palpatória)">
              <div className="mb-6"><CheckboxGroup name="corporal_postura" label="Alterações Posturais:" options={ALTERACOES_POSTURAIS} control={control} /></div>
              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t dark:border-gray-700">
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Lipodistrofia (Gordura Localizada)</h4>
                    <CheckboxGroup name="corporal_lipodistrofia" label="Tipo:" options={TIPOS_LIPODISTROFIA} control={control} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região da Gordura:</label><RegionGrid name="corporal_gordura_local" options={REGIOES_CORPORAIS} control={control} /></div>
                 </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Fibroedema Gelóide (Celulite)</h4>
                    <SelectField label="Grau Predominante" name="corporal_celulite_grau" register={register} options={GRAUS_ACNE} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região da Celulite:</label><RegionGrid name="corporal_celulite_local" options={REGIOES_CORPORAIS} control={control} /></div>
                 </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mt-6 pt-6 border-t dark:border-gray-700">
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Estrias</h4>
                    <CheckboxGroup name="corporal_estrias" label="Tipo:" options={TIPOS_ESTRIAS} control={control} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região das Estrias:</label><RegionGrid name="corporal_estrias_local" options={REGIOES_CORPORAIS} control={control} /></div>
                 </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Flacidez Corporal</h4>
                    <CheckboxGroup name="corporal_flacidez_tipo" label="Tipo:" options={FLACIDEZ_CORPORAL} control={control} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região da Flacidez:</label><RegionGrid name="corporal_flacidez_local" options={REGIOES_CORPORAIS} control={control} /></div>
                 </div>
              </div>
              <div className="mt-6"><Field label="Observações Corporais Gerais"><textarea {...register("corporal_observacoes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="Outras alterações, edema, cicatrizes..." /></Field></div>
           </Section>
        </div>

        {/* --- ABA 5: PLANO --- */}
        <div className={activeTab === "plano" ? "block" : "hidden"}>
           <Section title="Diagnóstico e Planejamento">
              <div className="grid md:grid-cols-2 gap-6">
                 <LabelSlider label="Satisfação Imagem Corporal (0-10)" name="satisfacao_imagem_corporal" register={register} min="0" max="10" low="Péssima" high="Ótima" />
                 <SelectField label="Preferência de Plano" name="preferencia_plano" register={register} options={["Rápido/Intensivo", "Gradual/Suave", "A critério profissional"]} />
              </div>
              <div className="mt-6"><Field label="Plano Terapêutico Proposto"><textarea {...register("plano_inicial")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none min-h-[200px]" placeholder="Protocolos sugeridos, número de sessões, home care..." /></Field></div>
              <div className="grid md:grid-cols-3 gap-4 mt-4"><InputWithLabel label="Nº Sessões (Estimado)" {...register("numero_sessoes_estimado")} type="number" /><InputWithLabel label="Intervalo (dias)" {...register("intervalo_sessoes")} /><InputWithLabel label="Regiões Prioritárias" {...register("prioridade_regioes")} /></div>
              <div className="mt-6"><Field label="Alertas / Red Flags"><textarea {...register("red_flags_profissional")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none bg-red-50 border-red-200" placeholder="Restrições, cuidados especiais..." /></Field></div>
           </Section>
        </div>

        {/* --- ABA 6: TERMOS --- */}
        <div className={activeTab === "termos" ? "block" : "hidden"}>
           <div className="max-w-2xl mx-auto space-y-8 py-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                 <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Consentimento & LGPD</h3>
                 <p className="text-sm text-blue-700 dark:text-blue-200 mb-6">Antes de coletar a assinatura, é obrigatório que o paciente tenha ciência do termo de uso de imagem e dados.</p>
                 <Button type="button" onClick={() => setShowTermoModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto gap-2 py-6 text-base shadow-md"><FileText size={20} /> Ler Termo de Consentimento Completo</Button>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckSquare className="text-gray-500" /> Checklist Final</h3>
                 <div className="space-y-4 text-left">
                    <CheckboxItem name="termo_aceito" label="Declaro que LI E ACEITO o Termo de Consentimento e Autorização de Imagem (LGPD)" register={register} />
                    <CheckboxItem name="autoriza_foto" label="Autoriza captura de fotos para prontuário médico/técnico" register={register} />
                    <CheckboxItem name="autoriza_midia" label="Autoriza uso de imagem em redes sociais (opcional)" register={register} />
                 </div>
              </div>
              
              <div className="pt-6 border-t mt-8">
                 <div className="text-left mb-10">
                   <label className="font-bold mb-2 block text-gray-700">Assinatura Digital do Paciente</label>
                   {/* COMPONENTE DE ASSINATURA QUE RECEBE A SALVA */}
                   <SignaturePad 
                      onEnd={(data) => setSignatureData(data)} 
                      existingSignature={savedSignature}
                      isLoading={saving} 
                   />
                   <p className="text-xs text-gray-400 mt-2 text-center">Ao assinar, o paciente concorda com todos os termos apresentados acima.</p>
                 </div>
                 <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="w-full py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center justify-center gap-3">
                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle size={24} />}
                    Finalizar e Salvar Anamnese
                 </Button>
              </div>
           </div>
        </div>

        {/* --- 🔹 ABA 7: FOTOS (AGORA COM UPLOAD FUNCIONAL) --- */}
        <div className={activeTab === "fotos" ? "block" : "hidden"}>
          <Section title="Registro Fotográfico & Evolução">
            
            {/* ÁREA DE UPLOAD */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                />
                <Button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploading} 
                    className="gap-2 mx-auto"
                >
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                    Carregar Nova Foto
                </Button>
                <p className="text-xs text-gray-500 mt-2">Formatos aceitos: JPG, PNG. Máx 5MB.</p>
            </div>

            {/* GALERIA DE FOTOS DO PACIENTE */}
            {patientPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {patientPhotos.map((url, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-square">
                            <img src={url} alt={`Foto ${index}`} className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => deletePhoto(url)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* COMPARATIVO */}
            <div className="mb-8 text-center border-t pt-8">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center justify-center gap-2">
                  <ImageIcon size={20}/> Comparativo (Exemplo)
              </h3>
              
              {/* SE TIVER PELO MENOS 2 FOTOS, MOSTRA O SLIDER COM AS REAIS, SENÃO MOSTRA EXEMPLO */}
              {patientPhotos.length >= 2 ? (
                  <BeforeAfterSlider
                    beforeImage={patientPhotos[0]}
                    afterImage={patientPhotos[patientPhotos.length - 1]}
                    beforeLabel="Primeira Foto"
                    afterLabel="Última Foto"
                  />
              ) : (
                  <div className="opacity-70">
                      <p className="text-sm text-gray-500 mb-2">Carregue pelo menos 2 fotos para ver o comparativo real.</p>
                      <BeforeAfterSlider
                        beforeImage="https://images.unsplash.com/photo-1589992896844-9b32159b2526?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        afterImage="https://images.unsplash.com/photo-1512291313931-65595900407b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        beforeLabel="Exemplo Antes"
                        afterLabel="Exemplo Depois"
                      />
                  </div>
              )}
            </div>
          </Section>
        </div>

      </form>

      {/* MODAL DE TERMO */}
      {showTermoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-2xl">
                 <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileText size={24} /></div><div><h3 className="font-bold text-lg text-gray-900 dark:text-white">Termo de Consentimento</h3><p className="text-xs text-gray-500">LGPD & Uso de Imagem</p></div></div>
                 <button onClick={() => setShowTermoModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 text-sm text-justify leading-7 text-gray-700 dark:text-gray-300 font-serif bg-white dark:bg-gray-900">
                 <div className="max-w-3xl mx-auto space-y-6">
                    <h4 className="font-bold text-center text-base mb-6 uppercase tracking-wide">TERMO DE CONSENTIMENTO E AUTORIZAÇÃO PARA CAPTAÇÃO, ARMAZENAMENTO E UTILIZAÇÃO DE IMAGENS — VERSÃO DISCORRIDA COMPLETA (LGPD)</h4>
                    {TERMO_LGPD_COMPLETO.split('\n\n').map((paragraph, index) => (paragraph.trim() && <p key={index}>{paragraph}</p>))}
                 </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl flex justify-between items-center">
                 <p className="text-xs text-gray-500 hidden sm:block">Leia até o final para concordar.</p>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="ghost" onClick={() => setShowTermoModal(false)} className="w-full sm:w-auto">Cancelar</Button>
                    <Button onClick={() => { setValue("termo_aceito", true); setShowTermoModal(false); toast.success("Termo lido e pré-aceito."); }} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">Li e Concordo</Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default PatientAnamnesisPage;