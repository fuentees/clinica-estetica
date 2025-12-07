import jsPDF from "jspdf";

// ============================================================================
// 1. TEXTO JURÍDICO (Para proteção legal)
// ============================================================================
const TERMO_JURIDICO_COMPLETO = `
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & DECLARAÇÃO DE SAÚDE

1. IDENTIFICAÇÃO E VERACIDADE: O(A) paciente identificado(a) neste documento declara que todas as informações de qualificação civil, histórico de saúde, uso de medicamentos e hábitos de vida fornecidas são absolutamente verdadeiras. O(A) paciente assume total responsabilidade civil e criminal por quaisquer danos decorrentes da omissão ou falsidade destas informações.

2. CONSENTIMENTO INFORMADO: Declaro ter recebido informações claras e suficientes sobre a natureza dos procedimentos estéticos indicados, seus benefícios esperados, riscos inerentes (como hematomas, edema, assimetrias temporárias, reações alérgicas, entre outros), contraindicações e cuidados pré e pós-procedimento.

3. RESULTADOS: Declaro estar ciente de que a Medicina/Estética não é uma ciência exata e que os resultados dependem de fatores biológicos individuais, resposta do organismo, genética e estrita obediência às orientações pós-procedimento. Compreendo que não há garantia de resultado específico.

4. USO DE IMAGEM (LGPD): Autorizo, de forma livre e inequívoca, a captura, armazenamento e utilização de minhas imagens (fotografias e vídeos) pela clínica e seus profissionais para fins de: (a) Prontuário médico e acompanhamento da evolução clínica; (b) Documentação legal e comprovação técnica. Caso tenha assinalado a opção específica, autorizo também o uso para fins de divulgação (marketing).

5. AUTORIZAÇÃO: Estando ciente e de acordo com todos os itens acima, autorizo a realização da avaliação e dos procedimentos propostos.
`;

// ============================================================================
// 2. INTERFACE DE DADOS
// ============================================================================
interface PatientData {
  id?: string;
  name?: string; nome?: string; full_name?: string;
  first_name?: string; last_name?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string; birth_date?: string; date_of_birth?: string;
  telefone?: string; phone?: string; whatsapp?: string;
  email?: string;
  profissao?: string; occupation?: string;
  estado_civil?: string; marital_status?: string;
  sexo?: string;

  cep?: string; rua?: string; numero?: string; bairro?: string; cidade?: string; estado?: string;
  endereco?: string; address?: string; street?: string; logradouro?: string; zip_code?: string;
  
  [key: string]: any;
}

// ============================================================================
// 3. FUNÇÃO GERADORA PRINCIPAL
// ============================================================================
const generateAnamnesisPdf = (
  patientData: PatientData, 
  anamnesisData: any,       
  signatureBase64: string | null
) => {
  const doc = new jsPDF();
  const marginLeft = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginLeft * 2);
  let cursorY = 20;

  // --- CORES & ESTILO ---
  const colorPrimary = [180, 50, 80]; // Um tom de rosa/vinho elegante
  const colorDark = [40, 40, 40];
  const colorGray = [100, 100, 100];
  const colorLightGray = [240, 240, 240];

  // --- HELPERS ---
  const checkPageBreak = (spaceNeeded: number = 20) => {
    if (cursorY + spaceNeeded > 280) {
      doc.addPage();
      cursorY = 20;
    }
  };

  const formatVal = (v: any) => {
    if (v === true || v === "true") return "SIM";
    if (v === false || v === "false") return "NÃO";
    if (!v || v === "") return "---";
    if (Array.isArray(v)) return v.length > 0 ? v.join(", ").toUpperCase() : "NADA RELATADO";
    return String(v).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "---";
    try {
      const date = new Date(dateString + "T12:00:00"); 
      const ageDifMs = Date.now() - new Date(dateString).getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${date.toLocaleDateString('pt-BR')} (${isNaN(age) ? '?' : age} ANOS)`;
    } catch {
      return dateString;
    }
  };

  // Cabeçalho de Seção "Bonitinho"
  const drawHeader = (title: string) => {
    checkPageBreak(15);
    cursorY += 8;
    
    // Fundo cinza suave
    doc.setFillColor(colorLightGray[0], colorLightGray[1], colorLightGray[2]);
    doc.rect(marginLeft, cursorY - 5, contentWidth, 8, "F");
    
    // Barra lateral colorida
    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(marginLeft, cursorY - 5, 2, 8, "F");

    // Texto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.text(title.toUpperCase(), marginLeft + 4, cursorY + 0.5);
    
    cursorY += 10;
  };

  const addLine = (label: string, value: any, xOffset: number = 0, inline: boolean = false) => {
    if (!inline) checkPageBreak();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text(`${label}:`, marginLeft + xOffset, cursorY);

    const valStr = formatVal(value);
    const labelWidth = doc.getTextWidth(`${label}:`);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    
    // Destaca alertas em Vermelho/Rosa
    const isAlert = (valStr === "SIM") && !label.includes("Atividade") && !label.includes("Água");
    if (isAlert || (valStr !== "NÃO" && valStr !== "---" && valStr !== "NADA RELATADO" && (label.includes("Doenças") || label.includes("Alergias")))) {
       doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
       doc.setFont("helvetica", "bold");
    }

    // Quebra de linha automática para valores longos
    const maxWidth = contentWidth - (xOffset + labelWidth);
    const splitValue = doc.splitTextToSize(valStr, maxWidth);
    
    doc.text(splitValue, marginLeft + xOffset + labelWidth + 2, cursorY);
    
    if (!inline) cursorY += (splitValue.length * 4.5) + 2;
  };

  // ==========================================
  // CONSTRUÇÃO DO DOCUMENTO
  // ==========================================

  // --- TOPO (LOGO E TÍTULO) ---
  // Círculo decorativo
  doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.circle(marginLeft + 4, 16, 4, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text("PRONTUÁRIO ESTÉTICO", marginLeft + 12, 18);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 150, 18);

  // Linha fina separadora do cabeçalho
  doc.setDrawColor(220);
  doc.line(marginLeft, 24, pageWidth - marginLeft, 24);

  cursorY = 32;

  // --- 1. IDENTIFICAÇÃO ---
  drawHeader("1. Qualificação do Paciente");

  // Normalização de Dados
  let nomeFinal = "---";
  if (patientData.first_name) {
    nomeFinal = `${patientData.first_name} ${patientData.last_name || ''}`;
  } else {
    nomeFinal = patientData.name || patientData.nome || patientData.full_name || "---";
  }

  const cpf = patientData.cpf;
  const rg = patientData.rg;
  const sexo = patientData.sexo;
  const nasc = patientData.date_of_birth || patientData.birth_date || patientData.data_nascimento;
  const prof = patientData.occupation || patientData.profissao;
  const tel = patientData.phone || patientData.telefone || patientData.whatsapp;
  const email = patientData.email;

  // Endereço
  let endFinal = "---";
  if (patientData.rua) {
      const n = patientData.numero || "S/N";
      const b = patientData.bairro ? ` - ${patientData.bairro}` : "";
      const c = patientData.cidade ? `. ${patientData.cidade}` : "";
      const u = patientData.estado ? `/${patientData.estado}` : "";
      const cep = patientData.cep ? ` - CEP: ${patientData.cep}` : "";
      endFinal = `${patientData.rua}, ${n}${b}${c}${u}${cep}`;
  } else {
      endFinal = patientData.address || patientData.endereco || "---";
  }

  // Linha 1: Nome (Destaque)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(nomeFinal.toUpperCase(), marginLeft, cursorY);
  cursorY += 6;

  // Grade de dados
  addLine("CPF", cpf, 0, true);
  addLine("RG", rg, 60, true);
  addLine("Sexo", sexo, 110, false);
  cursorY += 6;

  addLine("Nascimento", formatDate(nasc), 0, true);
  addLine("Profissão", prof, 60, false);
  cursorY += 6;

  addLine("Celular", tel, 0, true);
  addLine("Email", email, 60, false);
  cursorY += 6;

  addLine("Endereço", endFinal, 0, false);
  cursorY += 4;

  // --- 2. ANAMNESE ---
  drawHeader("2. Declaração de Saúde & Hábitos");

  // Queixa
  if (anamnesisData.queixa_principal && anamnesisData.queixa_principal.length > 0) {
     addLine("Queixas", anamnesisData.queixa_principal);
  }
  if (anamnesisData.queixa_principal_detalhada) {
      addLine("Relato", anamnesisData.queixa_principal_detalhada);
  }

  // Histórico
  addLine("Doenças Crônicas", anamnesisData.doencas_cronicas);
  if (anamnesisData.outros_doencas) addLine("Outras Doenças", anamnesisData.outros_doencas);
  
  addLine("Alergias", anamnesisData.alergias_medicamentosas);
  if (anamnesisData.alergia_cosmeticos) addLine("Outras Alergias", anamnesisData.alergia_cosmeticos);
  
  addLine("Usa Medicação?", anamnesisData.usa_medicacao_continua);
  if (anamnesisData.usa_medicacao_continua === "true" || anamnesisData.usa_medicacao_continua === true) {
      doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      doc.setFont("helvetica", "bold");
      const lista = String(anamnesisData.lista_medicacoes || "").toUpperCase();
      doc.text(`   ↳ QUAIS: ${lista}`, marginLeft, cursorY);
      cursorY += 6;
  }

  // Grid de Riscos
  cursorY += 4;
  const riskFactors = [
      { l: "Gestante", v: anamnesisData.gestante },
      { l: "Lactante", v: anamnesisData.lactante },
      { l: "Fumante", v: anamnesisData.fumante },
      { l: "Roacutan", v: anamnesisData.uso_retinoide },
      { l: "Anticoagulantes", v: anamnesisData.uso_anticoagulante },
      { l: "Quelóide", v: anamnesisData.historico_queloide },
      { l: "Implantes", v: anamnesisData.implantes_metalicos },
      { l: "Herpes", v: anamnesisData.historico_herpes },
      { l: "Intercorrência?", v: anamnesisData.teve_intercorrencia },
  ];

  let col = 0;
  
  riskFactors.forEach((item) => {
      if (cursorY > 270) { doc.addPage(); cursorY = 20; }

      const xPos = marginLeft + (col * 60); // 3 colunas
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(item.l, xPos, cursorY);
      
      const valStr = formatVal(item.v);
      doc.setFont("helvetica", "bold");
      if(valStr === "SIM") doc.setTextColor(220, 0, 0); 
      else doc.setTextColor(40);
      doc.text(valStr, xPos + 35, cursorY);

      col++;
      if (col > 2) { // 3 Colunas para ficar mais compacto
          col = 0; 
          cursorY += 5; 
      }
  });
  if (col !== 0) cursorY += 5; 
  cursorY += 2;

  if (anamnesisData.teve_intercorrencia === "true" || anamnesisData.teve_intercorrencia === true) {
      addLine("Detalhe Intercorrência", anamnesisData.intercorrencias_detalhes);
  }

  addLine("Atividade Física?", anamnesisData.pratica_atividade, 0, true);
  addLine("Água Adequada?", anamnesisData.ingere_agua, 90, false);
  cursorY += 6;

  // --- 3. CONSENTIMENTO (JUSTIFICADO E BONITO) ---
  checkPageBreak(120);
  drawHeader("3. Termo de Consentimento Legal");

  // Texto Justificado
  doc.setFont("times", "normal"); // Fonte serifada fica mais "jurídica"
  doc.setFontSize(9);
  doc.setTextColor(40);
  
  // O jsPDF splitTextToSize quebra linhas, mas o alinhamento 'justify' é feito no .text
  const textOptions: any = { 
      maxWidth: contentWidth, 
      align: "justify",
      lineHeightFactor: 1.3 // Mais espaçamento entre linhas
  };
  
  // Imprime o texto justificado
  // Nota: o retorno de text() com justify pode variar dependendo da versão, 
  // mas maxWidth + align: justify é o padrão moderno.
  doc.text(TERMO_JURIDICO_COMPLETO.trim(), marginLeft, cursorY, textOptions);
  
  // Calcula o espaço ocupado pelo texto para mover o cursor
  const dim = doc.getTextDimensions(TERMO_JURIDICO_COMPLETO.trim(), textOptions);
  cursorY += dim.h + 10;

  // Checkboxes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0);
  
  const box = (checked: any) => (checked === true || checked === "true") ? "[ X ]" : "[   ]";
  
  checkPageBreak(30);
  doc.text(`${box(anamnesisData.termo_aceito)} Declaro que LI E ACEITO integralmente os termos acima.`, marginLeft, cursorY);
  cursorY += 5;
  doc.text(`${box(anamnesisData.autoriza_foto)} Autorizo a captura de fotos para meu prontuário.`, marginLeft, cursorY);
  cursorY += 5;
  doc.text(`${box(anamnesisData.autoriza_midia)} Autorizo o uso de minha imagem em redes sociais.`, marginLeft, cursorY);
  cursorY += 20;

  // --- 4. ASSINATURA ---
  checkPageBreak(60);
  
  // Caixa de assinatura
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, cursorY + 30, marginLeft + 100, cursorY + 30);
  
  if (signatureBase64) {
    try {
        doc.addImage(signatureBase64, "PNG", marginLeft + 5, cursorY, 60, 28);
    } catch (e) {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("(Imagem da assinatura indisponível)", marginLeft, cursorY + 15);
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(200, 0, 0);
    doc.text("(Assinatura Pendente no Sistema)", marginLeft, cursorY + 20);
  }

  cursorY += 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(nomeFinal.toUpperCase(), marginLeft, cursorY);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`CPF: ${cpf || '---'}`, marginLeft, cursorY + 4);
  doc.text(`Assinado em: ${new Date().toLocaleString('pt-BR')}`, marginLeft, cursorY + 8);

  // --- RODAPÉ ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, 290, { align: "right" });
      doc.text("Sistema Clínica Estética", marginLeft, 290);
  }

  // Salvar
  const safeName = (nomeFinal || "paciente").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Prontuario_${safeName}.pdf`);
};

export default generateAnamnesisPdf;