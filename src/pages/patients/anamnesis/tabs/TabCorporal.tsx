import { useFormContext, useWatch, Controller } from "react-hook-form";
import { useEffect } from "react";
import { 
  Scale, Activity, Target, 
  Map, Info
} from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

export function TabCorporal() {
  const { register, control, setValue } = useFormContext();
  
  // Observando valores para cálculo
  const peso = useWatch({ name: "peso", control });
  const altura = useWatch({ name: "altura", control });

  // Lógica de IMC (Atualizada para suportar a máscara)
  useEffect(() => {
    if (peso && altura) {
      // Normaliza: Troca vírgula por ponto e garante número
      const p = parseFloat(String(peso).replace(",", "."));
      const a = parseFloat(String(altura).replace(",", "."));
      
      if (p > 0 && a > 0) {
        // Se a altura vier mascarada (1.75), o cálculo é direto
        const imcValue = (p / (a * a)).toFixed(2);
        setValue("imc", imcValue);
      }
    }
  }, [peso, altura, setValue]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 1. BIOMETRIA */}
        <Components.Section 
          title="Biometria & Sinais Vitais" 
          icon={Scale} 
          description="Medidas antropométricas base para o tratamento"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Components.InputWithLabel 
                  label="Peso (kg)" 
                  name="peso"
                  type="number" 
                  step="0.1" 
                  placeholder="0.0"
                  register={register}
              />

              {/* INPUT DE ALTURA COM MÁSCARA AUTOMÁTICA */}
              <Controller
                name="altura"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Components.InputWithLabel
                    {...field}
                    label="Altura (m)"
                    placeholder="0.00"
                    type="tel" // 'tel' evita setinhas de número e permite formatação
                    maxLength={4} // Limita caracteres (ex: 1.85)
                    value={value || ""}
                    onChange={(e: any) => {
                      // 1. Remove tudo que não é número
                      const rawValue = e.target.value.replace(/\D/g, "");
                      
                      if (rawValue === "") {
                        onChange("");
                        return;
                      }

                      // 2. Transforma em decimal (ex: 175 -> 1.75)
                      const floatValue = parseFloat(rawValue) / 100;
                      
                      // 3. Formata para string com 2 casas
                      onChange(floatValue.toFixed(2));
                    }}
                  />
                )}
              />
              
              {/* Card de IMC com destaque visual */}
              <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest ml-1">
                    IMC Calculado
                  </label>
                  <div className="relative group">
                    <input
                      readOnly
                      {...register("imc")}
                      className="w-full h-12 px-4 rounded-xl bg-emerald-50 text-emerald-600 font-black text-lg border-2 border-emerald-100 outline-none cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                        <Info size={18} />
                    </div>
                  </div>
              </div>

              <Components.InputWithLabel 
                  label="Pressão Arterial" 
                  name="pressao_arterial"
                  placeholder="120/80"
                  register={register}
              />
          </div>
        </Components.Section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* 2. GORDURA E CELULITE */}
            <Components.Section 
                title="Lipodistrofia & FEG" 
                icon={Target}
                description="Análise de gordura localizada e celulite"
            >
                <div className="space-y-10">
                    <Components.CheckboxGroup 
                        name="corporal_lipodistrofia" 
                        label="Tipo de Gordura:" 
                        options={Constants.TIPOS_LIPODISTROFIA || ["Ginoide", "Androide", "Mista"]} 
                        control={control} 
                    />
                    
                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                        <Components.RegionGrid 
                            name="corporal_gordura_local" 
                            label="Zonas de Acúmulo:"
                            options={Constants.REGIOES_CORPORAIS || ["Abdômen", "Flancos", "Culotes", "Braços", "Interno Coxa"]} 
                            control={control} 
                        />
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                        <Components.SelectField 
                            label="Grau da Celulite (FEG)" 
                            name="corporal_celulite_grau" 
                            register={register} 
                            options={["Grau I - Apenas à compressão", "Grau II - Visível em pé", "Grau III - Casca de Laranja", "Grau IV - Fibrose e Dor"]} 
                        />
                    </div>
                </div>
            </Components.Section>

            {/* 3. FLACIDEZ E ESTRIAS */}
            <Components.Section 
                title="Tessitura e Pele" 
                icon={Activity}
                description="Avaliação de flacidez e integridade cutânea"
            >
                <div className="space-y-10">
                    <Components.CheckboxGroup 
                        name="corporal_flacidez_tipo" 
                        label="Tipo de Flacidez:" 
                        options={Constants.FLACIDEZ_CORPORAL || ["Tissular (Pele)", "Muscular", "Mista"]} 
                        control={control} 
                    />
                    
                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                        <Components.CheckboxGroup 
                            name="corporal_estrias" 
                            label="Estrias Identificadas:" 
                            options={Constants.TIPOS_ESTRIAS || ["Rubras (Vermelhas)", "Albas (Brancas)", "Atróficas"]} 
                            control={control} 
                        />
                    </div>
                </div>
            </Components.Section>
        </div>

        {/* 4. POSTURA E OBSERVAÇÕES */}
        <Components.Section 
          title="Estrutura & Postura" 
          icon={Map}
          description="Observações biomecânicas relevantes"
        >
            <div className="space-y-10">
                <Components.RegionGrid 
                    name="corporal_postura" 
                    label="Alterações Estruturais:"
                    options={Constants.ALTERACOES_POSTURAIS || ["Escoliose", "Hiperlordose", "Cifose", "Pés Planos", "Joelho Valgo"]} 
                    control={control} 
                />
                
                <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                    <Components.TextAreaField 
                        label="Notas Clínicas Adicionais"
                        name="corporal_observacoes"
                        register={register}
                        placeholder="Descreva detalhes como edema (cacifo), cicatrizes, sensibilidade ao toque ou metas específicas..."
                    />
                </div>
            </div>
        </Components.Section>
    </div>
  );
}