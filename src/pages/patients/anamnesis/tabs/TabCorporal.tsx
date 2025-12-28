import { useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { 
  Scale, Activity, Target, 
  Map, Info 
} from "lucide-react"; // Removidos Ruler e AlertCircle (não usados)
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

export function TabCorporal() {
  const { register, control, setValue } = useFormContext();
  
  // Observando Peso e Altura para o cálculo automático de IMC
  const peso = useWatch({ name: "peso", control });
  const altura = useWatch({ name: "altura", control });

  // Lógica de cálculo de IMC: peso / (altura * altura)
  useEffect(() => {
    if (peso && altura) {
      const p = parseFloat(peso.toString().replace(",", "."));
      const a = parseFloat(altura.toString().replace(",", "."));
      
      if (p > 0 && a > 0) {
        const imcValue = (p / (a * a)).toFixed(2);
        setValue("imc", imcValue);
      }
    }
  }, [peso, altura, setValue]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. BIOMETRIA (Cálculo Automático) */}
        <Components.Section 
          title="Biometria & Composição" 
          icon={Scale} 
          description="Dados antropométricos e sinais vitais"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Components.InputWithLabel 
                  label="Peso (kg)" 
                  type="number" 
                  step="0.1" 
                  placeholder="70.5"
                  {...register("peso")} 
              />
              <Components.InputWithLabel 
                  label="Altura (m)" 
                  type="number" 
                  step="0.01" 
                  placeholder="1.75"
                  {...register("altura")} 
              />
              <div className="relative group">
                  <Components.InputWithLabel 
                      label="IMC" 
                      readOnly 
                      {...register("imc")} 
                      style={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: '900' }}
                  />
                  {/* CORREÇÃO: Removido 'title' do ícone e adicionado posicionamento correto */}
                  <div className="absolute top-10 right-4 text-emerald-500">
                    <Info size={18} />
                  </div>
              </div>
              <Components.InputWithLabel 
                  label="P.A. (Pressão)" 
                  placeholder="12/8"
                  {...register("pressao_arterial")} 
              />
          </div>
        </Components.Section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* 2. GORDURA E CELULITE */}
            <Components.Section title="Lipodistrofia & Celulite" icon={Target}>
                <div className="space-y-10">
                    <Components.CheckboxGroup 
                        name="corporal_lipodistrofia" 
                        label="Tipo de Gordura Predominante:" 
                        options={Constants.TIPOS_LIPODISTROFIA} 
                        control={control} 
                    />
                    
                    <div className="pt-8 border-t border-gray-100">
                        <Components.RegionGrid 
                            name="corporal_gordura_local" 
                            label="Regiões com Gordura Localizada:"
                            options={Constants.REGIOES_CORPORAIS} 
                            control={control} 
                        />
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <Components.SelectField 
                            label="Grau da Celulite (FEG)" 
                            name="corporal_celulite_grau" 
                            register={register} 
                            options={["Grau I (Invisível)", "Grau II (Visível)", "Grau III (Nódulos)", "Grau IV (Dor/Fibrose)"]} 
                        />
                    </div>
                </div>
            </Components.Section>

            {/* 3. FLACIDEZ E ESTRIAS */}
            <Components.Section title="Qualidade Tissular" icon={Activity}>
                <div className="space-y-10">
                    <Components.CheckboxGroup 
                        name="corporal_flacidez_tipo" 
                        label="Tipo de Flacidez Identificada:" 
                        options={Constants.FLACIDEZ_CORPORAL} 
                        control={control} 
                    />
                    
                    <div className="pt-8 border-t border-gray-100">
                        <Components.CheckboxGroup 
                            name="corporal_estrias" 
                            label="Tipos de Estrias Presentes:" 
                            options={Constants.TIPOS_ESTRIAS} 
                            control={control} 
                        />
                    </div>
                </div>
            </Components.Section>
        </div>

        {/* 4. POSTURA E OBSERVAÇÕES ADICIONAIS */}
        <Components.Section 
          title="Análise Postural & Observações" 
          icon={Map}
          description="Alterações estruturais e notas clínicas"
        >
            <div className="space-y-10">
                <Components.RegionGrid 
                    name="corporal_postura" 
                    label="Alterações Posturais Observadas:"
                    options={Constants.ALTERACOES_POSTURAIS} 
                    control={control} 
                />
                
                <div className="pt-8 border-t border-gray-100">
                    <Components.TextareaField 
                        label="Observações Detalhadas da Avaliação Corporal"
                        name="corporal_observacoes"
                        register={register}
                        placeholder="Descreva detalhes como tônus muscular, edema, cicatrizes ou outras particularidades..."
                    />
                </div>
            </div>
        </Components.Section>
    </div>
  );
}