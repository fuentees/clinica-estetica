import React, { useState } from 'react';
import { X, Plus, Info, RotateCw } from 'lucide-react';

// --- TIPAGEM ---
export interface MarkedArea {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'facial' | 'corporal';
  // 'view' controla se o ponto está na frente, lado ou costas
  view?: 'front' | 'side' | 'back'; 
  subType?: 'front' | 'back'; // Mantido para compatibilidade com dados antigos
}

interface BodyMappingProps {
  value?: MarkedArea[];
  onChange: (areas: MarkedArea[]) => void;
  viewMode: 'face' | 'body';
}

// ==========================================
// DESENHOS TÉCNICOS ANATÔMICOS (MEDICAL CHARTS)
// ==========================================

const MedicalFaceFront = () => (
  <g stroke="#71717a" strokeWidth="0.8" fill="#fafafa">
    {/* Contorno Craniano e Facial Realista */}
    <path d="M50,40 C50,15 85,8 100,8 C115,8 150,15 150,40 V55 C150,85 142,125 100,145 C58,125 50,85 50,55 V40 Z" />
    
    {/* Orelhas Detalhadas */}
    <path d="M50,55 C42,52 42,75 50,80" fill="none" strokeWidth="0.6" />
    <path d="M150,55 C158,52 158,75 150,80" fill="none" strokeWidth="0.6" />

    {/* Linhas de Expressão (Frontal) */}
    <path d="M80,35 Q100,38 120,35" fill="none" stroke="#e4e4e7" />

    {/* Sobrancelhas Anatômicas */}
    <path d="M60,50 Q75,42 90,50" fill="none" strokeWidth="1.2" stroke="#a1a1aa" strokeLinecap="round" />
    <path d="M110,50 Q125,42 140,50" fill="none" strokeWidth="1.2" stroke="#a1a1aa" strokeLinecap="round" />

    {/* Olhos Realistas */}
    <path d="M63,62 Q76,54 89,62 Q76,70 63,62 Z" fill="white" />
    <circle cx="76" cy="62" r="2.5" fill="#d4d4d8" stroke="none" />
    
    <path d="M111,62 Q124,54 137,62 Q124,70 111,62 Z" fill="white" />
    <circle cx="124" cy="62" r="2.5" fill="#d4d4d8" stroke="none" />

    {/* Nariz (Dorso e Asas) */}
    <path d="M100,55 Q98,90 94,95 Q100,100 106,95 Q102,90 100,55" fill="none" strokeWidth="0.6" />

    {/* Lábios (Arco do Cupido e Inferior) */}
    <path d="M85,110 Q100,105 115,110" fill="none" strokeWidth="0.8" />
    <path d="M85,110 Q100,118 115,110" fill="none" strokeWidth="0.6" />
    <path d="M88,112 Q100,125 112,112" fill="none" strokeWidth="0.6" />

    {/* Linhas Guias Médicas (Pontilhadas) */}
    <line x1="100" y1="10" x2="100" y2="145" stroke="#e4e4e7" strokeDasharray="2,2" strokeWidth="0.5" />
    <line x1="50" y1="62" x2="150" y2="62" stroke="#e4e4e7" strokeDasharray="2,2" strokeWidth="0.5" />
  </g>
);

const MedicalFaceSide = () => (
  <g stroke="#71717a" strokeWidth="0.8" fill="#fafafa" transform="translate(30,0)">
    {/* Perfil Humano Realista */}
    <path d="M60,20 C80,20 110,30 110,60 V70 C110,75 112,78 108,80 C108,80 115,85 105,90 C105,90 108,95 100,95 L102,105 L100,110 L102,115 C102,115 100,125 90,130 L70,140 V150" fill="none" />
    <path d="M60,20 C40,20 30,50 30,80 C30,120 50,140 70,150" fill="none" strokeDasharray="2,2" stroke="#e4e4e7" />

    {/* Detalhes do Perfil */}
    <path d="M110,60 L115,75 L108,80" fill="none" /> {/* Nariz */}
    <path d="M102,92 L105,95" fill="none" /> {/* Lábio Sup */}
    <path d="M102,98 L105,102" fill="none" /> {/* Lábio Inf */}
    
    {/* Orelha Lateral */}
    <path d="M55,70 C45,65 45,95 55,95 C60,95 62,80 55,70" fill="white" />
    
    {/* Olho Lateral */}
    <path d="M75,65 L85,65 L80,68 Z" fill="none" strokeWidth="0.5" />
    
    {/* Linha Mandíbula (Jawline) */}
    <path d="M58,105 Q75,125 90,130" fill="none" stroke="#d4d4d4" strokeWidth="1" />
  </g>
);

const MedicalBodyFront = () => (
  <g stroke="#71717a" strokeWidth="0.8" fill="#fafafa" transform="translate(45, 10) scale(0.6)">
     {/* Pescoço */}
     <path d="M85,30 Q85,50 65,55" fill="none" />
     <path d="M115,30 Q115,50 135,55" fill="none" />
     
     {/* Ombros e Braços */}
     <path d="M65,55 L30,60 Q20,60 20,80 L20,180" fill="none" />
     <path d="M135,55 L170,60 Q180,60 180,80 L180,180" fill="none" />
     
     {/* Torso (Cintura e Quadris Anatômicos) */}
     <path d="M65,55 Q65,100 70,110 Q60,140 55,180 L50,380" fill="none" />
     <path d="M135,55 Q135,100 130,110 Q140,140 145,180 L150,380" fill="none" />
     
     {/* Entrepernas */}
     <path d="M50,380 L90,380 L95,220 Q100,210 105,220 L110,380 L150,380" fill="none" />

     {/* Detalhes Anatômicos */}
     <path d="M85,55 Q100,65 115,55" stroke="#e4e4e7" fill="none" /> {/* Clavícula */}
     <circle cx="100" cy="115" r="1" fill="#d4d4d4" stroke="none" /> {/* Umbigo */}
     <path d="M70,170 Q100,190 130,170" stroke="#e4e4e7" fill="none" strokeDasharray="4,4" /> {/* Linha Pélvica */}
  </g>
);

const MedicalBodyBack = () => (
  <g stroke="#71717a" strokeWidth="0.8" fill="#fafafa" transform="translate(45, 10) scale(0.6)">
     {/* Silhueta Costas */}
     <path d="M85,30 Q85,50 65,55 L30,60 L25,180" fill="none" />
     <path d="M115,30 Q115,50 135,55 L170,60 L175,180" fill="none" />
     
     <path d="M65,55 Q70,100 65,110 Q55,150 55,180 L50,380" fill="none" />
     <path d="M135,55 Q130,100 135,110 Q145,150 145,180 L150,380" fill="none" />
     
     <path d="M50,380 L90,380 L95,230" fill="none" />
     <path d="M150,380 L110,380 L105,230" fill="none" />

     {/* Detalhes Glúteos e Coluna */}
     <path d="M65,180 Q85,220 100,220 Q115,220 135,180" fill="none" stroke="#d4d4d4" />
     <path d="M100,40 L100,180" stroke="#e4e4e7" strokeDasharray="3,3" />
     <path d="M80,70 L90,90" stroke="#e4e4e7" /> {/* Escápula Esq */}
     <path d="M120,70 L110,90" stroke="#e4e4e7" /> {/* Escápula Dir */}
  </g>
);

// --- COMPONENTE PRINCIPAL ---
export function BodyMappingComponent({ value = [], onChange, viewMode }: BodyMappingProps) {
  // Estado que controla o ângulo: 'front' (frente), 'side' (perfil) ou 'back' (costas - só corpo)
  const [currentAngle, setCurrentAngle] = useState<'front' | 'side' | 'back'>('front');
  
  const [tempPoint, setTempPoint] = useState<{x: number, y: number} | null>(null);
  const [label, setLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Define quais botões mostrar baseado se é Rosto ou Corpo
  const angleOptions = viewMode === 'face' 
    ? [{ id: 'front', label: 'Frontal' }, { id: 'side', label: 'Perfil / Lateral' }]
    : [{ id: 'front', label: 'Frente' }, { id: 'back', label: 'Costas' }];

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // Cálculo percentual para responsividade
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTempPoint({ x, y });
    setLabel(""); 
    setIsOpen(true); 
  };

  const handleSavePoint = () => {
    if (!tempPoint || !label) return;

    const newPoint: MarkedArea = {
      id: Math.random().toString(36).substr(2, 9),
      x: tempPoint.x,
      y: tempPoint.y,
      label: label,
      type: viewMode === 'face' ? 'facial' : 'corporal',
      view: currentAngle as any // Salva o ângulo atual (front/side/back)
    };

    onChange([...value, newPoint]);
    setIsOpen(false);
    setTempPoint(null);
  };

  const handleRemovePoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(p => p.id !== id));
  };

  // Filtra pontos: Mostra apenas os do tipo certo (face/corpo) E do ângulo certo (frente/lado)
  const visiblePoints = value.filter(p => {
    // 1. Filtro por tipo (Facial ou Corporal)
    const typeMatch = viewMode === 'face' ? p.type === 'facial' : p.type === 'corporal';
    
    // 2. Filtro por ângulo (Frontal, Lateral, Costas)
    // Se o ponto não tiver 'view' (legado), usa o 'subType' ou assume 'front'
    const pointView = p.view || (p.subType === 'back' ? 'back' : 'front');
    const viewMatch = pointView === currentAngle;

    return typeMatch && viewMatch;
  });

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Botões de Troca de Ângulo (Estilo Toggle Premium) */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-4 shadow-inner w-full max-w-[280px]">
        {angleOptions.map(opt => (
          <button 
            key={opt.id}
            type="button"
            onClick={() => setCurrentAngle(opt.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentAngle === opt.id 
                ? 'bg-white text-pink-600 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            {opt.id === 'side' && <RotateCw size={12} />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* ÁREA DE DESENHO */}
      <div className="relative border border-gray-200 bg-white rounded-xl overflow-hidden cursor-crosshair shadow-sm hover:border-pink-300 transition-colors w-full max-w-[280px]">
        
        {/* Aviso de interação */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-medium text-gray-400 bg-white/90 px-2.5 py-1 rounded-full border border-gray-100 shadow-sm pointer-events-none z-10">
          <Info size={12} className="text-pink-400"/> Toque para marcar
        </div>

        <svg 
          viewBox="0 0 200 250" 
          className="w-full h-auto"
          onClick={handleSvgClick}
        >
          {/* Renderização Condicional dos Vetores Médicos */}
          {viewMode === 'face' && currentAngle === 'front' && <MedicalFaceFront />}
          {viewMode === 'face' && currentAngle === 'side' && <MedicalFaceSide />}
          
          {viewMode === 'body' && currentAngle === 'front' && <MedicalBodyFront />}
          {viewMode === 'body' && currentAngle === 'back' && <MedicalBodyBack />}

          {/* Renderiza os pontos */}
          {visiblePoints.map((point) => (
            <g key={point.id} transform={`translate(${point.x * 2}, ${point.y * 2.5})`}>
              {/* Efeito de "Onda" no ponto */}
              <circle r="8" fill="rgba(236, 72, 153, 0.2)" className="animate-ping" style={{ animationDuration: '2s' }} />
              {/* O Ponto Fixo */}
              <circle r="3.5" fill="#db2777" stroke="white" strokeWidth="1.5" />
              {/* Tooltip fixa acima do ponto */}
              <rect x="-30" y="-22" width="60" height="14" rx="4" fill="white" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.9" />
              <text y="-12" textAnchor="middle" fill="#374151" fontSize="8" fontWeight="600">{point.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Lista de Pontos (Tags) */}
      <div className="mt-4 w-full flex flex-wrap gap-2 justify-center min-h-[30px]">
        {visiblePoints.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Nenhuma marcação nesta visão.</p>
        ) : (
          visiblePoints.map(p => (
            <div key={p.id} className="group flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-md text-xs text-gray-600 shadow-sm hover:border-pink-200 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
              <span className="font-medium">{p.label}</span>
              <button type="button" onClick={(e) => handleRemovePoint(p.id, e)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal de Input */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-5 rounded-2xl shadow-xl w-full max-w-[280px] animate-in fade-in zoom-in duration-200 border border-white/20">
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Plus size={14} className="text-pink-600 bg-pink-100 p-0.5 rounded"/> Nova Marcação
            </h4>
            
            <input 
              autoFocus
              type="text" 
              placeholder="Descreva a região..." 
              className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePoint()}
            />
            
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSavePoint} 
                className="px-3 py-1.5 text-xs font-medium bg-pink-600 text-white hover:bg-pink-700 rounded-lg shadow-sm shadow-pink-200 transition-all flex items-center gap-1.5"
              >
                Salvar Ponto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}