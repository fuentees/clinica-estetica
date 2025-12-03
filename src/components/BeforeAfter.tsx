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
    <div className="rounded-xl overflow-hidden shadow-xl border-4 border-white h-full">
      <ReactCompareSlider
        itemOne={
          <div className="relative h-full">
            <ReactCompareSliderImage src={beforeImage} alt="Antes" style={{ height: '100%', objectFit: 'cover' }} />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              {labelBefore}
            </div>
          </div>
        }
        itemTwo={
          <div className="relative h-full">
            <ReactCompareSliderImage src={afterImage} alt="Depois" style={{ height: '100%', objectFit: 'cover' }} />
            <div className="absolute top-4 right-4 bg-pink-600/80 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              {labelAfter}
            </div>
          </div>
        }
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}