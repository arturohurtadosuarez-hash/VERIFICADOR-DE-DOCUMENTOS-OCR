import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileUp, 
  FolderSync, 
  Sparkles, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { inspectUploadedFile } from '../utils/pdfInspectorClient';
import { AuditRecord } from '../types';

interface UploadDropzoneProps {
  onFilesAudited: (newRecords: AuditRecord[]) => void;
  onLoadDemoBatch: () => void;
  minCharsPage: number;
  minCharsSqInch: number;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFilesAudited,
  onLoadDemoBatch,
  minCharsPage,
  minCharsSqInch
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo con formato .pdf');
      return;
    }

    setIsProcessing(true);
    setProcessProgress({ current: 0, total: pdfFiles.length });

    const results: AuditRecord[] = [];

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      try {
        const record = await inspectUploadedFile(file, minCharsPage, minCharsSqInch);
        results.push(record);
      } catch (err) {
        console.error('Error inspeccionando archivo:', err);
      }
      setProcessProgress({ current: i + 1, total: pdfFiles.length });
    }

    onFilesAudited(results);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs mb-6">
      
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/50 scale-[1.005]' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        {isProcessing ? (
          <div className="py-4 space-y-3">
            <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">
              Auditando capa OCR y calculando hashes... ({processProgress.current} de {processProgress.total})
            </h4>
            <div className="w-64 max-w-full mx-auto bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-200"
                style={{ width: `${(processProgress.current / processProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">Extracción de texto, medición de densidad y comprobación SHA-256</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Arrastra y suelta aquí tus archivos PDF para auditoría inmediata
            </h4>
            <p className="text-xs text-slate-500 max-w-md">
              Soporta carga masiva. Se extraerá la capa de texto, se medirán dimensiones, densidad tipográfica (c/in²), metadatos ISO y huellas criptográficas MD5/SHA-256.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Examinar Archivos Locales
              </span>
              <span className="text-xs text-slate-400">o</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadDemoBatch();
                }}
                className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Cargar Lote de Demostración Corporativo
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
