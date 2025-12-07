import jsPDF from "jspdf";

// ============================================================================
// 1. TEXTO JURÍDICO (Para proteção legal)
// ============================================================================
const TERMO_JURIDICO_COMPLETO = `
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & DECLARAÇÃO DE SAÚDE

1. IDENTIFICAÇÃO E VERACIDADE: O(A) paciente identificado(a) neste documento declara que todas as informações de qualificação civil, histórico de saúde, uso de medicamentos e hábitos de vida fornecidas são absolutamente verdadeiras. O(A) paciente assume total responsabilidade civil e criminal por quaisquer danos decorrentes da omissão ou falsidade destas informações.

2. CONSENTIMENTO INFORMADO: Declaro ter recebido informações claras e suficientes sobre a natureza dos procedimentos estéticos indicados, seus benefícios esperados, riscos inerentes (como hematomas, edema, assimetrias temporárias, reações alérgicas, entre outros), contraindicações e cuidados pré e pós-procedimento.

3. RESULTADOS: Declaro estar ciente de que a Medicina/Estética não é uma ciência exata e que os resultados dependem de fatores biológicos individuais, resposta do organismo, genética e estrita obediência às orientações pós-procedimento. Compreendo que não há garantia de resultado específico.

4. USO DE IMAGEM (LGPD): Autorizo, de forma livre e inequívoca, a captura, armazenamento e utilização de minhas imagens (fotografias e vídeos) pela clínica e seus profissionais para fins de: (a) Prontuário médico e acompanhamento da evolução clínica; (b) Documentação legal e comprovação técnica.

5. AUTORIZAÇÃO: Estando ciente e de acordo com todos os itens acima, autorizo a realização da avaliação e dos procedimentos propostos.
`;

// ============================================================================
// 2. INTERFACE DE DADOS (FLEXÍVEL PARA SEU BD)
// ============================================================================
interface PatientData {
  // Campos comuns de cadastro
  name?: string; nome?: string; full_name?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string; birth_date?: string;
  telefone?: string; phone?: string; whatsapp?: string;
  email?: string;
  profissao?: string; occupation?: string;
  estado_civil?: string; marital_status?: string;
  
  // Endereço (Suporta campos separados ou juntos)
  endereco?: string; address?: string; street?: string; logradouro?: string;
  numero?: string; number?: string;
  bairro?: string; neighborhood?: string;
  cidade?: string; city?: string;
  estado?: string; state?: string; uf?: string;
  cep?: string; zip_code?: string;
  
  [key: string]: any;
}

// ============================================================================
// 3. FUNÇÃO GERADORA
// ============================================================================
const generateAnamnesisPdf = (
  patientData: PatientData, 
  anamnesisData: any,       
  signatureBase64: string | null
) => {
  const doc = new jsPDF();
  const marginLeft = 20;
  let cursorY = 20;

  // --- CONFIGURAÇÕES VISUAIS ---
  const colorRed = [220, 38, 38]; 
  const colorGray = [80, 80, 80];
  const colorBlack = [0, 0, 0];

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
    if (!v || v === "") return "---"; // Mostra traço para campos vazios do cadastro
    if (Array.isArray(v)) return v.length > 0 ? v.join(", ").toUpperCase() : "NADA RELATADO";
    return String(v).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "---";
    try {
      const date = new Date(dateString);
      const ageDifMs = Date.now() - date.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${date.toLocaleDateString('pt-BR')} (${age} ANOS)`;
    } catch {
      return dateString;
    }
  };

  const drawHeader = (title: string) => {
    checkPageBreak(15);
    cursorY += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(marginLeft, cursorY - 4, 170, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(colorRed[0], colorRed[1], colorRed[2]);
    doc.text(title.toUpperCase(), marginLeft + 2, cursorY + 1);
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
    doc.setTextColor(colorBlack[0], colorBlack[1], colorBlack[2]);
    
    // Destaca em vermelho alertas de saúde SIM
    if ((valStr === "SIM" && label !== "Pratica Atividade Física" && label !== "Ingestão de Água Adequada?") || (valStr !== "NÃO" && valStr !== "---" && valStr !== "NADA RELATADO" && (label.includes("Doenças") || label.includes("Alergias")))) {
       doc.setTextColor(colorRed[0], colorRed[1], colorRed[2]);
       doc.setFont("helvetica", "bold");
    }

    const splitValue = doc.splitTextToSize(valStr, 170 - (marginLeft + xOffset + labelWidth));
    doc.text(splitValue, marginLeft + xOffset + labelWidth + 2, cursorY);
    
    if (!inline) cursorY += (splitValue.length * 5) + 2;
  };

  // ==========================================
  // CONSTRUÇÃO DO PDF
  // ==========================================

  // --- LOGO ---
  doc.setFillColor(colorRed[0], colorRed[1], colorRed[2]);
  doc.circle(marginLeft + 5, 15, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("+", marginLeft + 3.5, 16.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("PRONTUÁRIO ESTÉTICO", marginLeft + 15, 18);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, 140, 18);

  cursorY = 30;

  // --- 1. IDENTIFICAÇÃO COMPLETA (CADASTRO) ---
  drawHeader("1. Qualificação do Paciente");

  // Normalização dos dados (Pega o que tiver preenchido)
  const nome = patientData.name || patientData.nome || patientData.full_name;
  const cpf = patientData.cpf;
  const rg = patientData.rg;
  const nasc = patientData.birth_date || patientData.data_nascimento;
  const prof = patientData.occupation || patientData.profissao;
  const civil = patientData.marital_status || patientData.estado_civil;
  const tel = patientData.phone || patientData.telefone || patientData.whatsapp;
  const email = patientData.email;
  
  // Montagem Inteligente de Endereço
  let endFinal = "---";
  // Se tiver campos separados
  const rua = patientData.address || patientData.endereco || patientData.street || patientData.logradouro;
  if (rua) {
      const n = patientData.numero || patientData.number || "S/N";
      const b = patientData.bairro || patientData.neighborhood || "";
      const c = patientData.cidade || patientData.city || "";
      const u = patientData.estado || patientData.state || patientData.uf || "";
      const cep = patientData.cep || patientData.zip_code || "";
      endFinal = `${rua}, ${n} - ${b}. ${c}/${u} - CEP: ${cep}`;
  }

  // Linha 1
  addLine("Nome", nome, 0, true);
  addLine("CPF", cpf, 110, false);
  cursorY += 6;
  
  // Linha 2
  addLine("Nascimento", formatDate(nasc), 0, true);
  addLine("RG", rg, 80, true);
  addLine("Estado Civil", civil, 130, false);
  cursorY += 6;

  // Linha 3
  addLine("Profissão", prof, 0, true);
  addLine("Celular", tel, 110, false);
  cursorY += 6;

  // Linha 4
  addLine("Email", email, 0, false); // Email pode ser longo, linha exclusiva
  
  // Linha 5
  addLine("Endereço", endFinal, 0, false); // Endereço pode ser longo
  cursorY += 4;

  // --- 2. ANAMNESE (DECLARAÇÃO DO PACIENTE) ---
  drawHeader("2. Declaração de Saúde & Hábitos");

  // Motivo
  addLine("Queixa Principal", anamnesisData.queixa_principal);
  if (anamnesisData.queixa_principal_detalhada) {
      addLine("Relato do Paciente", anamnesisData.queixa_principal_detalhada);
  }

  // Histórico Clínico
  addLine("Doenças Crônicas", anamnesisData.doencas_cronicas);
  addLine("Alergias Medicamentosas", anamnesisData.alergias_medicamentosas);
  addLine("Outras Alergias", anamnesisData.alergia_cosmeticos);
  
  addLine("Usa Medicação Contínua?", anamnesisData.usa_medicacao_continua);
  if (anamnesisData.usa_medicacao_continua === "true" || anamnesisData.usa_medicacao_continua === true) {
      doc.setTextColor(colorRed[0], colorRed[1], colorRed[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`   ↳ Quais: ${String(anamnesisData.lista_medicacoes || "").toUpperCase()}`, marginLeft, cursorY);
      cursorY += 6;
  }

  // Grid de Fatores de Risco
  cursorY += 2;
  const riskFactors = [
      { l: "Gestante", v: anamnesisData.gestante },
      { l: "Lactante", v: anamnesisData.lactante },
      { l: "Fumante", v: anamnesisData.fumante },
      { l: "Uso de Roacutan", v: anamnesisData.uso_retinoide },
      { l: "Anticoagulantes", v: anamnesisData.uso_anticoagulante },
      { l: "Quelóide", v: anamnesisData.historico_queloide },
      { l: "Implantes Metálicos", v: anamnesisData.implantes_metalicos },
      { l: "Já teve Intercorrência?", v: anamnesisData.teve_intercorrencia },
  ];

  let col = 0;
  riskFactors.forEach((item) => {
      checkPageBreak();
      const xPos = marginLeft + (col * 85);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(item.l, xPos, cursorY);
      
      const valStr = formatVal(item.v);
      doc.setFont("helvetica", "bold");
      if(valStr === "SIM") doc.setTextColor(220, 0, 0); 
      else doc.setTextColor(0);
      doc.text(valStr, xPos + 60, cursorY);

      col++;
      if (col > 1) { col = 0; cursorY += 6; }
  });
  if (col === 1) cursorY += 6; 
  cursorY += 5;

  // Hábitos
  addLine("Pratica Atividade Física?", anamnesisData.pratica_atividade, 0, true);
  addLine("Ingestão de Água Adequada?", anamnesisData.ingere_agua, 90, false);
  cursorY += 6;

  // --- 3. TERMOS JURÍDICOS ---
  checkPageBreak(120); // Garante que o termo e assinatura fiquem juntos
  drawHeader("3. CONSENTIMENTO LEGAL");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  const splitTermo = doc.splitTextToSize(TERMO_JURIDICO_COMPLETO.trim(), 170);
  doc.text(splitTermo, marginLeft, cursorY);
  cursorY += (splitTermo.length * 3.5) + 8;

  // Checkboxes de Aceite
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  const box = (checked: boolean) => checked ? "[ X ]" : "[   ]";
  
  doc.text(`${box(anamnesisData.termo_aceito)} Declaro que LI E ACEITO integralmente os termos acima.`, marginLeft, cursorY);
  cursorY += 5;
  doc.text(`${box(anamnesisData.autoriza_foto)} Autorizo a captura de fotos para meu prontuário.`, marginLeft, cursorY);
  cursorY += 5;
  doc.text(`${box(anamnesisData.autoriza_midia)} Autorizo o uso de minha imagem em redes sociais.`, marginLeft, cursorY);
  cursorY += 15;

  // --- 4. ASSINATURA ---
  checkPageBreak(50);
  if (signatureBase64) {
    try {
        doc.addImage(signatureBase64, "PNG", marginLeft, cursorY, 50, 25);
        cursorY += 25;
        doc.setDrawColor(0);
        doc.line(marginLeft, cursorY, marginLeft + 80, cursorY);
        doc.setFontSize(8);
        doc.text(formatVal(nome), marginLeft, cursorY + 5);
        doc.setTextColor(150);
        doc.text(`Assinado digitalmente em: ${new Date().toLocaleString()}`, marginLeft, cursorY + 9);
    } catch {
        doc.text("(Erro imagem assinatura)", marginLeft, cursorY);
    }
  } else {
    cursorY += 15;
    doc.setDrawColor(0);
    doc.line(marginLeft, cursorY, marginLeft + 80, cursorY);
    doc.text(formatVal(nome), marginLeft, cursorY + 5);
    doc.setTextColor(200, 0, 0);
    doc.text("(Assinatura Pendente)", marginLeft, cursorY + 10);
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Sistema Clínica Estética - Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
  }

  // Salvar
  const safeName = (nome || "paciente").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Prontuario_${safeName}.pdf`);
};

export default generateAnamnesisPdf;