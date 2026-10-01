import React from 'react';
import { 
  FileCheck, 
  AlertTriangle, 
  Layers, 
  HardDrive, 
  Copy, 
  Percent,
  PieChart as PieIcon,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { AuditKPIs } from '../types';

interface KpiCardsProps {
  kpis: AuditKPIs;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  const isHealthy = kpis.pct_cumplimiento >= 80;

  // Preparación de datos para el Gráfico de Anillos (Donut Chart)
  const chartData = [
    { 
      name: 'Conforme OCR', 
      value: kpis.conformes, 
      color: '#10B981', // Verde esmeralda
      bgColor: 'bg-emerald-500',
      label: 'Conforme'
    },
    { 
      name: 'OCR Parcial / Mixto', 
      value: kpis.requieren_ocr_parcial, 
      color: '#F59E0B', // Ámbar
      bgColor: 'bg-amber-500',
      label: 'OCR Parcial'
    },
    { 
      name: 'Requiere OCR Total', 
      value: kpis.requieren_ocr_total, 
      color: '#EF4444', // Rojo carmesí
      bgColor: 'bg-red-500',
      label: 'OCR Total'
    },
    ...(kpis.bloqueados > 0 ? [{ 
      name: 'Bloqueado / Cifrado', 
      value: kpis.bloqueados, 
      color: '#64748B', // Slate
      bgColor: 'bg-slate-500',
      label: 'Cifrado'
    }] : [])
  ].filter(d => d.value > 0);

  // Si no hay datos, mostrar un anillo placeholder gris
  const hasData = kpis.total_pdfs > 0 && chartData.length > 0;
  const placeholderData = [{ name: 'Sin datos', value: 1, color: '#E2E8F0', bgColor: 'bg-slate-200', label: 'Vacío' }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      
      {/* SECCIÓN IZQUIERDA: 6 TARJETAS DE KPIS PRINCIPALES (8 Columnas en desktop) */}
      <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        
        {/* 1. Total PDFs */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Total PDFs</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{kpis.total_pdfs}</span>
              <span className="text-xs text-slate-500">archivos</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {kpis.total_paginas} páginas analizadas
            </div>
          </div>
        </div>

        {/* 2. % Cumplimiento OCR */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">% Legibilidad</span>
            <div className={`p-1.5 rounded-lg ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {kpis.pct_cumplimiento}%
              </span>
              <span className="text-xs text-slate-500">conforme</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, kpis.pct_cumplimiento))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Requieren Intervención */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Requieren OCR</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-red-600">
                {kpis.requieren_ocr_total + kpis.requieren_ocr_parcial}
              </span>
              <span className="text-xs text-red-500">críticos</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="text-red-500 font-medium">{kpis.requieren_ocr_total} totales</span>
              <span>•</span>
              <span>{kpis.requieren_ocr_parcial} parciales</span>
            </div>
          </div>
        </div>

        {/* 4. Páginas Huérfanas (Solo Imagen) */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Págs Sin OCR</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-amber-600">{kpis.paginas_sin_ocr}</span>
              <span className="text-xs text-slate-500">huérfanas</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Solo imagen sin capa texto
            </div>
          </div>
        </div>

        {/* 5. Volumen MB */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Volumen</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{kpis.total_mb}</span>
              <span className="text-xs text-slate-500">MB</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Almacenamiento auditado
            </div>
          </div>
        </div>

        {/* 6. Duplicados SHA-256 */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase">Duplicados</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Copy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{kpis.total_duplicados_archivos}</span>
              <span className="text-xs text-slate-500">archivos</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              En {kpis.total_duplicados_grupos} grupos de SHA-256
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN DERECHA: GRÁFICO DE ANILLOS CON RECHARTS (5 Columnas en desktop) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        
        {/* Cabecera del Gráfico */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <PieIcon className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Distribución de Estados
              </h4>
              <p className="text-[10px] text-slate-400">Lectura rápida del lote analizado</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {kpis.total_pdfs} docs
          </span>
        </div>

        {/* Contenedor del Gráfico de Anillos y Leyenda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
          
          {/* Donut Chart Recharts */}
          <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const pct = kpis.total_pdfs > 0 
                        ? Math.round(((data.value as number) / kpis.total_pdfs) * 1000) / 10 
                        : 0;
                      return (
                        <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-slate-300 text-[11px]">
                            {data.value} {data.value === 1 ? 'archivo' : 'archivos'} ({pct}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={hasData ? chartData : placeholderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={hasData ? 3 : 0}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {(hasData ? chartData : placeholderData).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="cursor-pointer hover:opacity-85 transition-opacity"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Texto en el Centro del Anillo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-base font-extrabold ${isHealthy ? 'text-emerald-600' : 'text-slate-800'}`}>
                {kpis.total_pdfs > 0 ? `${kpis.pct_cumplimiento}%` : '0%'}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                Aptitud
              </span>
            </div>
          </div>

          {/* Leyenda Detallada y Porcentajes */}
          <div className="flex-1 w-full space-y-1.5 text-xs">
            {hasData ? (
              chartData.map((item, idx) => {
                const percentage = kpis.total_pdfs > 0 
                  ? Math.round((item.value / kpis.total_pdfs) * 100) 
                  : 0;

                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.bgColor} flex-shrink-0`} />
                      <span className="text-[11px] font-medium text-slate-700 truncate max-w-[110px]" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-slate-900">{item.value}</span>
                      <span className="text-slate-400">({percentage}%)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No hay archivos para graficar. Arrastre archivos PDF para visualizar la distribución.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
