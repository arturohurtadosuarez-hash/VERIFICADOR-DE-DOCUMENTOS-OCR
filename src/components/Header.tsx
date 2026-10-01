import React from 'react';
import { 
  FileSearch, 
  FileSpreadsheet, 
  FileText, 
  Code2, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Trash2,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeaderProps {
  activeTab: 'auditor' | 'python_suite';
  setActiveTab: (tab: 'auditor' | 'python_suite') => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onResetSamples: () => void;
  onClearMatrix: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  hasRecords: boolean;
  pctCompliance: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  onExportPdf,
  onResetSamples,
  onClearMatrix,
  onOpenHistory,
  historyCount,
  hasRecords,
  pctCompliance
}) => {
  const triggerCelebration = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">
          
          {/* Logo y Título */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  AuditOCR
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                    PyMuPDF Engine
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría Forense de Capa OCR, Densidad Tipográfica y Metadatos ISO 32000-1
              </p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('auditor')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'auditor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Inspector en Vivo</span>
            </button>
            <button
              onClick={() => setActiveTab('python_suite')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'python_suite'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Arquitectura & Código Python</span>
            </button>
          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenHistory}
              title="Ver y restaurar estados anteriores de la matriz"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-700/60 text-xs text-indigo-200 hover:text-white transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Historial</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-[10px]">
                  {historyCount}
                </span>
              )}
            </button>

            {hasRecords && (
              <button
                onClick={onClearMatrix}
                title="Eliminar todos los archivos de la matriz"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs text-red-300 hover:text-red-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Limpiar Matriz</span>
              </button>
            )}

            <button
              onClick={onResetSamples}
              title="Restaurar lote de prueba"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Muestras</span>
            </button>

            <button
              onClick={() => {
                onExportExcel();
                triggerCelebration();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => {
                onExportPdf();
                triggerCelebration();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dictamen PDF</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
