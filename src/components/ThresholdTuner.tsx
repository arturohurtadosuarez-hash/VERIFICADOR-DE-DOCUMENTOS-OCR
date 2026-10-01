import React from 'react';
import { Sliders, HelpCircle, RefreshCw } from 'lucide-react';

interface ThresholdTunerProps {
  minCharsSqInch: number;
  setMinCharsSqInch: (val: number) => void;
  minCharsPage: number;
  setMinCharsPage: (val: number) => void;
  onApplyReevaluation: () => void;
}

export const ThresholdTuner: React.FC<ThresholdTunerProps> = ({
  minCharsSqInch,
  setMinCharsSqInch,
  minCharsPage,
  setMinCharsPage,
  onApplyReevaluation
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Calibración de Umbrales de Legibilidad Forense
          </h4>
          <p className="text-[11px] text-slate-500">
            Define la densidad mínima de caracteres aceptada para certificar aptitud OCR
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700">
        
        {/* Slider 1: Densidad (c/in²) */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Densidad Mínima:</span>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={minCharsSqInch}
            onChange={(e) => setMinCharsSqInch(parseFloat(e.target.value))}
            className="w-24 accent-blue-600 cursor-pointer"
          />
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {minCharsSqInch} c/in²
          </span>
        </div>

        {/* Number 2: Chars por página */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Mínimo Chars/Pág:</span>
          <input
            type="number"
            min="20"
            max="300"
            step="10"
            value={minCharsPage}
            onChange={(e) => setMinCharsPage(parseInt(e.target.value, 10) || 50)}
            className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-center font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={onApplyReevaluation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalcular Matriz</span>
        </button>

      </div>

    </div>
  );
};
