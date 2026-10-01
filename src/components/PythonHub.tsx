import React, { useState } from 'react';
import { 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  Cloud, 
  Sliders, 
  Layers, 
  BookOpen, 
  ShieldCheck,
  Cpu,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { downloadTextFile } from '../utils/exportUtils';

export const PythonHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'app_code' | 'requirements' | 'guide' | 'generator' | 'config'>('app_code');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Código python embebido para descarga directa e inspección
  const REQUIREMENTS_CONTENT = `# ==============================================================================
# Suite de Auditoría e Inspección OCR de Archivos PDF
# Archivo de Dependencias Python
# ==============================================================================

# Motor de Inspección y Manipulación de PDFs
PyMuPDF>=1.23.26           # Motor de análisis fitz de alto rendimiento para capa de texto y objetos

# Análisis de Datos y Manipulación Tabular
pandas>=2.1.4              # Gestión de DataFrames y métricas de auditoría
openpyxl>=3.1.2            # Generación y estilizado de hojas de cálculo Excel (.xlsx)

# Generación de Reportes Ejecutivos en PDF
reportlab>=4.1.0           # Maquetación de reportes PDF consolidados con gráficos y sellos

# Interfaz de Usuario Web Interactiva
streamlit>=1.31.0          # Dashboard interactivo con KPIs, filtros y gráficos

# Conectividad con Google Drive API
google-api-python-client>=2.118.0  # Cliente oficial de Google Cloud API
google-auth-httplib2>=0.2.0        # Autenticación HTTP para clientes de Google
google-auth-oauthlib>=1.2.0        # Flujos OAuth2 de usuario y Service Accounts

# Utilidades de Rendimiento y Criptografía
tqdm>=4.66.2               # Barras de progreso para CLI
cryptography>=42.0.2       # Soporte criptográfico para hashes y certificados
python-dotenv>=1.0.1       # Gestión de variables de entorno (.env)`;

  const SCRIPT_SNIPPET = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SUITE DE AUDITORÍA E INSPECCIÓN TÉCNICA DE CAPA OCR EN DOCUMENTOS PDF
Clases Principales:
  1. DriveConnector: Conectividad oficial con Google Drive API (drive.files.list)
  2. PDFInspector: Motor fitz (PyMuPDF), cálculo de densidad (c/in²), hashes y detección de huérfanos
  3. AuditReporter: Logging en auditoria_ocr_log.log, matriz Excel con openpyxl y reporte formal PDF
"""

# Ver archivo completo en audit_ocr_app.py
# Clases:
# - class DriveConnector: ...
# - class PDFInspector: ...
# - class AuditReporter: ...
# - def run_streamlit_dashboard(): ...
# - def run_cli_mode(): ...`;

  return (
    <div className="space-y-6">
      
      {/* Banner de Arquitectura */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white border border-slate-700 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs border border-blue-400/30">
                Arquitectura de Software Python
              </span>
              <span className="text-xs text-slate-400">ISO 32000-1 / Densidad Textual</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Suite de Auditoría e Inspección Técnica OCR
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Módulos estructurados orientados a objetos con separación de responsabilidades para ingesta multi-fuente (Local / Google Drive), inspección de capa de texto con PyMuPDF, cálculo de densidad por pulgada cuadrada, detección de páginas escaneadas sin OCR y generación automática de dictámenes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                fetch('/audit_ocr_app.py')
                  .then(r => r.text())
                  .then(txt => downloadTextFile('audit_ocr_app.py', txt, 'text/x-python'))
                  .catch(() => downloadTextFile('audit_ocr_app.py', SCRIPT_SNIPPET, 'text/x-python'));
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar audit_ocr_app.py</span>
            </button>
            <button
              onClick={() => downloadTextFile('requirements.txt', REQUIREMENTS_CONTENT, 'text/plain')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold border border-slate-600 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>requirements.txt</span>
            </button>
          </div>
        </div>

        {/* Diagrama de Flujo Modular */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60 text-xs">
          
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-blue-300 mb-1">
              <Cloud className="w-4 h-4 text-blue-400" />
              <span>1. Ingesta Multi-Fuente</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              <code className="text-blue-300">DriveConnector</code> & <code className="text-blue-300">pathlib</code>:
              Exploración de directorios locales, volúmenes SMB o Google Drive API con paginación y streaming de bytes.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>2. Inspección Profunda</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              <code className="text-emerald-300">PDFInspector</code>:
              PyMuPDF (<code className="text-emerald-300">fitz</code>), hashes MD5/SHA-256 en chunks, densidad tipográfica (c/in²) y detección de imágenes huérfanas.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>3. Auditoría & Logs</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              <code className="text-amber-300">auditoria_ocr_log.log</code>:
              Registro continuo de errores técnicos y contraseñas sin interrumpir el escaneo de lotes masivos.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              <span>4. Entregables & UI</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              <code className="text-purple-300">AuditReporter</code>:
              Dashboard en Streamlit, exportación Excel con formato condicional y reporte consolidado en PDF con ReportLab.
            </p>
          </div>

        </div>
      </div>

      {/* Navegación de Código y Documentación */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <div className="border-b border-slate-200 bg-slate-50 flex items-center px-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('app_code')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'app_code'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Script Principal (audit_ocr_app.py)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requirements')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'requirements'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>requirements.txt</span>
          </button>

          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'guide'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span>Guía de Instalación & Google Drive API</span>
          </button>

          <button
            onClick={() => setActiveSubTab('generator')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === 'generator'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-500" />
            <span>Generador de Pruebas (generador_muestras_test.py)</span>
          </button>
        </div>

        {/* Contenido de pestaña seleccionada */}
        <div className="p-5">
          
          {/* TAB 1: audit_ocr_app.py */}
          {activeSubTab === 'app_code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">audit_ocr_app.py</h3>
                  <p className="text-xs text-slate-500">
                    Contiene la implementación completa de las clases <code className="text-blue-600 font-semibold">DriveConnector</code>, <code className="text-emerald-600 font-semibold">PDFInspector</code> y <code className="text-purple-600 font-semibold">AuditReporter</code>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      fetch('/audit_ocr_app.py')
                        .then(r => r.text())
                        .then(txt => copyCode(txt, 'app_code'))
                        .catch(() => copyCode(SCRIPT_SNIPPET, 'app_code'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedKey === 'app_code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Código</span>
                  </button>
                </div>
              </div>

              {/* Guía Rápida de Comandos */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-slate-300">Ejecutar la suite en su servidor o máquina local:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-blue-400 font-bold block mb-1">Modo Interfaz Web (Streamlit):</span>
                    <code className="text-emerald-400 font-mono">streamlit run audit_ocr_app.py</code>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">Modo Consola / Servidor (CLI Batch):</span>
                    <code className="text-emerald-400 font-mono">python audit_ocr_app.py --source /data/docs --output_excel reporte.xlsx</code>
                  </div>
                </div>
              </div>

              {/* Visor de Código Estructurado */}
              <div className="bg-slate-950 rounded-xl p-4 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-[460px] border border-slate-800">
                <pre>{`# Estructura del archivo audit_ocr_app.py:

class DriveConnector:
    """Conectividad multi-fuente con Google Drive API usando service_account.json u OAuth2"""
    def list_pdf_files(folder_id=None, max_results=100) -> List[Dict]
    def download_file_to_bytes(file_id) -> BytesIO

class PDFInspector:
    """Motor forense PyMuPDF (fitz) para cálculo de densidad, hashes y páginas huérfanas"""
    def calculate_hashes(file_path_or_stream) -> Tuple[md5, sha256]
    def inspect_pdf(source_path_or_bytes, filename) -> Dict[str, Any]
    def scan_directory(folder_path, recursive=True) -> List[Dict]

class AuditReporter:
    """Generación de logs técnicos, KPIs, matriz Excel condicional y reporte formal PDF"""
    def identify_duplicates(audit_results) -> Dict[sha256, List[filenames]]
    def generate_kpis(audit_results) -> Dict
    def export_excel(audit_results, output_path) -> str
    def export_pdf_report(audit_results, output_pdf_path) -> str

def run_streamlit_dashboard():
    """Tablero interactivo con métricas, filtros y descargas en tiempo real"""

def run_cli_mode():
    """Ejecución desatendida mediante argparse para cron jobs o tuberías CI/CD"""`}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: requirements.txt */}
          {activeSubTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">requirements.txt</h3>
                  <p className="text-xs text-slate-500">Dependencias de producción verificadas y compatibles con Python 3.9+.</p>
                </div>
                <button
                  onClick={() => copyCode(REQUIREMENTS_CONTENT, 'reqs')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copiedKey === 'reqs' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar Dependencias</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                <pre>{REQUIREMENTS_CONTENT}</pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
                <span className="font-bold">Comando de instalación:</span>
                <pre className="mt-1 bg-white p-2 rounded border border-blue-200 font-mono text-slate-800">
                  pip install -r requirements.txt
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Guía de Instalación y Drive API */}
          {activeSubTab === 'guide' && (
            <div className="space-y-6 text-xs text-slate-700">
              
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  1. Instalación y Ejecución en Servidor Local / Remoto
                </h4>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    <strong>Crear un entorno virtual aislado:</strong>
                    <pre className="mt-1 bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px]">python3 -m venv venv && source venv/bin/activate</pre>
                  </li>
                  <li>
                    <strong>Instalar las dependencias de PyMuPDF, Pandas, Streamlit y ReportLab:</strong>
                    <pre className="mt-1 bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px]">pip install -r requirements.txt</pre>
                  </li>
                  <li>
                    <strong>Lanzar el dashboard web de auditoría:</strong>
                    <pre className="mt-1 bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px]">streamlit run audit_ocr_app.py</pre>
                  </li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  2. Configuración Paso a Paso de Google Drive API
                </h4>
                <div className="space-y-2 leading-relaxed">
                  <p>
                    Para permitir que el software explore carpetas compartidas en Google Drive mediante <code className="text-blue-700 font-mono">drive.files.list</code>:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>
                      Accede a la consola de <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console</a> y crea o selecciona un proyecto.
                    </li>
                    <li>
                      Habilita la <strong>Google Drive API</strong> desde el menú <em>APIs & Services &gt; Library</em>.
                    </li>
                    <li>
                      Ve a <em>Credentials</em> &gt; <em>Create Credentials</em> &gt; <strong>Service Account</strong> (Cuenta de Servicio).
                    </li>
                    <li>
                      Copia el correo generado (ej: <code className="bg-slate-200 px-1 py-0.5 rounded">auditor-ocr@mi-proyecto.iam.gserviceaccount.com</code>).
                    </li>
                    <li>
                      Descarga la clave en formato <strong>JSON</strong> y renómbrala a <code className="bg-slate-200 px-1 py-0.5 rounded">service_account.json</code> en la raíz del proyecto.
                    </li>
                    <li>
                      <strong>Paso fundamental:</strong> En tu Google Drive, ve a la carpeta que deseas auditar, presiona <strong>Compartir</strong> y añade la dirección de correo de la cuenta de servicio con permisos de <strong>Lector</strong>.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  3. Integración con Motores OCR de Remediación
                </h4>
                <p className="leading-relaxed">
                  Una vez que el auditor detecta archivos con estado <span className="text-red-700 font-bold">REQUIERE_OCR_TOTAL</span> o <span className="text-amber-700 font-bold">REQUIERE_OCR_PARCIAL</span>, puedes ejecutar automáticamente la remediación con <strong>OCRmyPDF</strong>:
                </p>
                <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {`# Instalar motor OCR local en Linux / Debian / Ubuntu:
sudo apt-get install -y ocrmypdf tesseract-ocr tesseract-ocr-spa

# Remediación automática preservando capas vectoriales existentes:
ocrmypdf --skip-text -l spa archivo_escaneado.pdf archivo_remediado.pdf`}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 4: Generador de Pruebas */}
          {activeSubTab === 'generator' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">generador_muestras_test.py</h3>
                  <p className="text-xs text-slate-500">
                    Script utilitario para generar 4 PDFs de prueba con distintos comportamientos forenses.
                  </p>
                </div>
                <button
                  onClick={() => {
                    fetch('/generador_muestras_test.py')
                      .then(r => r.text())
                      .then(txt => copyCode(txt, 'test_gen'))
                      .catch(() => {});
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copiedKey === 'test_gen' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar Script</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 text-slate-300 font-mono text-xs overflow-x-auto max-h-[380px] border border-slate-800">
                <pre>{`# Ejecuta este script para generar el set de prueba en local:
python generador_muestras_test.py

# Generará la carpeta ./muestras_pdf_test con:
# 1. 01_Conforme_Nativo.pdf (Capa de texto perfecta)
# 2. 02_Escaneado_Sin_OCR.pdf (Solo imagen rasterizada)
# 3. 03_Expediente_Mixto_Parcial.pdf (Página texto + página imagen)
# 4. 04_Encriptado_Con_Clave.pdf (Cifrado AES-256 con contraseña)`}</pre>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
