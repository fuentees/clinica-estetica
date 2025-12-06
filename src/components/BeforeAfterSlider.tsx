import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  className = "",
}) => {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl border-2 border-gray-100 dark:border-gray-700 relative group h-[400px] ${className}`}>
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={beforeImage} srcSet={beforeImage} alt="Antes" style={{ objectFit: 'cover', height: '100%' }} />}
        itemTwo={<ReactCompareSliderImage src={afterImage} srcSet={afterImage} alt="Depois" style={{ objectFit: 'cover', height: '100%' }} />}
        handle={
            <div className="h-full w-0.5 bg-red-500 absolute left-1/2 top-0 -translate-x-1/2 z-[10] pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.7)]">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2.5 rounded-full border-2 border-red-500 shadow-md text-red-600 flex items-center justify-center transition-transform group-hover:scale-110">
                <ChevronsLeftRight size={20} strokeWidth={2.5} />
               </div>
            </div>
        }
        style={{ height: '100%', width: '100%' }}
        position={50} 
      />
      <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold pointer-events-none z-20 transition-all opacity-100 group-hover:opacity-30">{beforeLabel}</div>
      <div className="absolute top-4 right-4 bg-red-600/80 text-white px-3 py-1.5 rounded-lg backdrop-blur-md text-sm font-bold pointer-events-none z-20 transition-all opacity-100 group-hover:opacity-30 border border-red-400/50">{afterLabel}</div>
    </div>
  );
};