import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  labelBefore?: string;
  labelAfter?: string;
}

export function BeforeAfter({ 
  beforeImage, 
  afterImage, 
  labelBefore = "Antes", 
  labelAfter = "Depois" 
}: BeforeAfterProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border-4 border-white h-full w-full bg-gray-200">
      <ReactCompareSlider
        itemOne={
          <div className="relative w-full h-full">
            <ReactCompareSliderImage 
              src={beforeImage} 
              alt="Antes" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
              {labelBefore}
            </div>
          </div>
        }
        itemTwo={
          <div className="relative w-full h-full">
            <ReactCompareSliderImage 
              src={afterImage} 
              alt="Depois" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div className="absolute top-4 right-4 bg-pink-600/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
              {labelAfter}
            </div>
          </div>
        }
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}