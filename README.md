# 📑 AuditOCR Enterprise Suite

> **Sistema Profesional de Auditoría Forense OCR, Calidad Documental y Preservación Digital conforme a la Norma Internacional ISO 32000-1.**

---

## 🚀 Resumen del Proyecto

**AuditOCR Enterprise Suite** es una solución integral diseñada para instituciones, despachos legales, archivos históricos y áreas de cumplimiento regulatorio que gestionan grandes repositorios documentales en formato PDF.

Permite auditar masivamente lotes de archivos para determinar si cuentan con una capa de texto real, indexable y accesible para minería de datos, o si por el contrario consisten en imágenes escaneadas que requieren intervención y OCRización urgente.

### 🌟 Capacidades Principales

- **Inspección Forense Multi-Capa (ISO 32000-1):**
  - Detección precisa de páginas huérfanas (*solo imagen sin capa OCR*).
  - Cálculo de densidad textual por pulgada cuadrada (`c/in²`) y recuento de caracteres.
  - Extracción de metadatos del productor, software de digitalización y detección de documentos cifrados con contraseña.
  - Huellas criptográficas de integridad forense (**SHA-256** y **MD5**) con detección automática de duplicados exactos.
- **Tablero Ejecutivo y Gráficos Interactivos:**
  - Scorecard de KPIs en tiempo real (Índice de cumplimiento, páginas huérfanas, volumen en MB).
  - **Gráfico de anillos (*Donut Chart*) con Recharts** para lectura visual instantánea de la distribución del lote (Conforme, OCR Parcial, Requiere OCR Total).
- **Matriz de Inspección Dinámica:**
  - Filtrado en tiempo real por nombre de archivo o estado general.
  - Píldoras de filtrado rápido y selección múltiple con casillas de verificación para eliminación masiva.
  - Ordenamiento automático por severidad de intervención técnica requerida.
- **Exportación de Entregables Corporativos:**
  - **Libro Excel (`.xlsx` con ExcelJS y openpyxl):** 3 hojas organizadas (*Resumen Ejecutivo*, *Matriz Detallada con filtros y paneles congelados*, y *Plan de Remediación con comandos `ocrmypdf`*).
  - **Dictamen Formal PDF (`.pdf` con jsPDF y ReportLab):** Encabezado institucional, sello de certificación ISO, numeración dinámica *Página X de Y* y bloque de custodia y firma digital.
  - **Log Técnico de Auditoría (`.log`):** Trazabilidad completa para auditorías legales.
- **Historial Local con `localStorage`:**
  - Almacena hasta los últimos 5 lotes generados con fecha y nombre personalizado.
  - Permite restaurar estados anteriores de la matriz con un solo clic.
- **Suite de Python CLI & Google Drive Integrada:**
  - Script independiente (`audit_ocr_app.py`) impulsado por **PyMuPDF (`fitz`)**, capaz de auditar carpetas locales completas o carpetas compartidas de Google Drive mediante OAuth 2.0.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Canvas-Confetti.
- **Exportación en Navegador:** ExcelJS, jsPDF, jsPDF-AutoTable.
- **Motor Python:** Python 3.11+, PyMuPDF (`fitz`), Pandas, OpenPyXL, ReportLab, Google Drive API v3.

---

## 💻 Instalación y Uso Local

### 1. Aplicación Web Interactiva (React + Vite)

Clona el repositorio e instala las dependencias de Node.js:

```bash
git clone https://github.com/TU_USUARIO/audit-ocr-enterprise.git
cd audit-ocr-enterprise
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

### 2. Motor de Inspección en Python (CLI)

Si prefieres ejecutar la auditoría directamente desde la terminal o integrarla en pipelines automatizados:

```bash
# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

#### Ejemplos de uso del script:

```bash
# Auditar una carpeta local con archivos PDF
python audit_ocr_app.py --folder "/ruta/a/mis_documentos" --out-excel "reporte_auditoria.xlsx" --out-pdf "dictamen.pdf"

# Auditar una carpeta de Google Drive por su Folder ID
python audit_ocr_app.py --gdrive-folder-id "1abcXYZ..." --credentials "credentials.json"

# Ajustar umbrales mínimos de densidad
python audit_ocr_app.py --folder "./docs" --min-chars-sq-in 1.5 --min-chars-page 100
```

---

## 📂 Estructura del Repositorio

```text
├── src/
│   ├── components/         # Componentes React (Matriz, KPIs, Gráficos, Modales)
│   ├── context/            # Contexto de notificaciones Toast
│   ├── utils/              # Exportadores (ExcelJS, jsPDF), storage e inspectores
│   ├── types.ts            # Definiciones de tipos TypeScript
│   ├── App.tsx             # Aplicación principal y gestión de estado
│   └── main.tsx            # Punto de entrada de React
├── audit_ocr_app.py        # Suite de auditoría en Python con PyMuPDF y ReportLab
├── requirements.txt        # Dependencias de Python
├── package.json            # Dependencias de Node.js
├── README.md               # Documentación general
└── .gitignore              # Reglas de exclusión de git
```

---

## ⚖️ Licencia

Distribuido bajo la licencia **Apache 2.0**.
