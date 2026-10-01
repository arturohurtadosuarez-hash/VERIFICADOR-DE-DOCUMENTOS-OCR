import { AuditRecord, PageDetail, ISOMetadata, GeneralStatus } from '../types';

// Función para calcular SHA-256 criptográfico real mediante Web Crypto API
async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Función para calcular MD5 en JavaScript puro rápido
function calculateMd5(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Algoritmo MD5 ligero para frontend
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  // Prepara buffer con padding
  const n = bytes.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= (bytes[i] & 0xff) << ((i % 4) * 8);
  }
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  words[(((n + 8) >> 6) << 4) + 14] = n * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, words[i + 0] || 0, 7, -680876936);
    d = md5ff(d, a, b, c, words[i + 1] || 0, 12, -389564586);
    c = md5ff(c, d, a, b, words[i + 2] || 0, 17, 606105819);
    b = md5ff(b, c, d, a, words[i + 3] || 0, 22, -1044525330);
    a = md5ff(a, b, c, d, words[i + 4] || 0, 7, -176418897);
    d = md5ff(d, a, b, c, words[i + 5] || 0, 12, 1200080426);
    c = md5ff(c, d, a, b, words[i + 6] || 0, 17, -1473231341);
    b = md5ff(b, c, d, a, words[i + 7] || 0, 22, -45705983);
    a = md5ff(a, b, c, d, words[i + 8] || 0, 7, 1770035416);
    d = md5ff(d, a, b, c, words[i + 9] || 0, 12, -1958414417);
    c = md5ff(c, d, a, b, words[i + 10] || 0, 17, -42063);
    b = md5ff(b, c, d, a, words[i + 11] || 0, 22, -1990404162);
    a = md5ff(a, b, c, d, words[i + 12] || 0, 7, 1804603682);
    d = md5ff(d, a, b, c, words[i + 13] || 0, 12, -40341101);
    c = md5ff(c, d, a, b, words[i + 14] || 0, 17, -1502002290);
    b = md5ff(b, c, d, a, words[i + 15] || 0, 22, 1236535329);

    a = md5gg(a, b, c, d, words[i + 1] || 0, 5, -165796510);
    d = md5gg(d, a, b, c, words[i + 6] || 0, 9, -1069501632);
    c = md5gg(c, d, a, b, words[i + 11] || 0, 14, 643717713);
    b = md5gg(b, c, d, a, words[i + 0] || 0, 20, -373897302);
    a = md5gg(a, b, c, d, words[i + 5] || 0, 5, -701558691);
    d = md5gg(d, a, b, c, words[i + 10] || 0, 9, 38016083);
    c = md5gg(c, d, a, b, words[i + 15] || 0, 14, -660478335);
    b = md5gg(b, c, d, a, words[i + 4] || 0, 20, -405537848);
    a = md5gg(a, b, c, d, words[i + 9] || 0, 5, 568446438);
    d = md5gg(d, a, b, c, words[i + 14] || 0, 9, -1019803690);
    c = md5gg(c, d, a, b, words[i + 3] || 0, 14, -187363961);
    b = md5gg(b, c, d, a, words[i + 8] || 0, 20, 1163531501);
    a = md5gg(a, b, c, d, words[i + 13] || 0, 5, -1444681467);
    d = md5gg(d, a, b, c, words[i + 2] || 0, 9, -51403784);
    c = md5gg(c, d, a, b, words[i + 7] || 0, 14, 1735328473);
    b = md5gg(b, c, d, a, words[i + 12] || 0, 20, -1926607734);

    a = md5hh(a, b, c, d, words[i + 5] || 0, 4, -378558);
    d = md5hh(d, a, b, c, words[i + 8] || 0, 11, -2022574463);
    c = md5hh(c, d, a, b, words[i + 11] || 0, 16, 1839030562);
    b = md5hh(b, c, d, a, words[i + 14] || 0, 23, -35309556);
    a = md5hh(a, b, c, d, words[i + 1] || 0, 4, -1530992060);
    d = md5hh(d, a, b, c, words[i + 4] || 0, 11, 1272893353);
    c = md5hh(c, d, a, b, words[i + 7] || 0, 16, -155497632);
    b = md5hh(b, c, d, a, words[i + 10] || 0, 23, -1094730640);
    a = md5hh(a, b, c, d, words[i + 13] || 0, 4, 681279174);
    d = md5hh(d, a, b, c, words[i + 0] || 0, 11, -358537222);
    c = md5hh(c, d, a, b, words[i + 3] || 0, 16, -722521979);
    b = md5hh(b, c, d, a, words[i + 6] || 0, 23, 76029189);
    a = md5hh(a, b, c, d, words[i + 9] || 0, 4, -640364487);
    d = md5hh(d, a, b, c, words[i + 12] || 0, 11, -421815835);
    c = md5hh(c, d, a, b, words[i + 15] || 0, 16, 530742520);
    b = md5hh(b, c, d, a, words[i + 2] || 0, 23, -995338651);

    a = md5ii(a, b, c, d, words[i + 0] || 0, 6, -198630844);
    d = md5ii(d, a, b, c, words[i + 7] || 0, 10, 1126891415);
    c = md5ii(c, d, a, b, words[i + 14] || 0, 15, -1416354905);
    b = md5ii(b, c, d, a, words[i + 5] || 0, 21, -57434055);
    a = md5ii(a, b, c, d, words[i + 12] || 0, 6, 1700485571);
    d = md5ii(d, a, b, c, words[i + 3] || 0, 10, -1894986606);
    c = md5ii(c, d, a, b, words[i + 10] || 0, 15, -1051523);
    b = md5ii(b, c, d, a, words[i + 1] || 0, 21, -2054922799);
    a = md5ii(a, b, c, d, words[i + 8] || 0, 6, 1873313359);
    d = md5ii(d, a, b, c, words[i + 15] || 0, 10, -30611744);
    c = md5ii(c, d, a, b, words[i + 6] || 0, 15, -1560198380);
    b = md5ii(b, c, d, a, words[i + 13] || 0, 21, 1309151649);
    a = md5ii(a, b, c, d, words[i + 4] || 0, 6, -145523070);
    d = md5ii(d, a, b, c, words[i + 11] || 0, 10, -1120210379);
    c = md5ii(c, d, a, b, words[i + 2] || 0, 15, 718787259);
    b = md5ii(b, c, d, a, words[i + 9] || 0, 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const hexChars = '0123456789abcdef';
  let out = '';
  for (const val of [a, b, c, d]) {
    for (let j = 0; j < 4; j++) {
      out += hexChars.charAt((val >> (j * 8 + 4)) & 0x0f) + hexChars.charAt((val >> (j * 8)) & 0x0f);
    }
  }
  return out;
}

// Analizador de flujo de bytes PDF para extraer metadata ISO y estadísticas
export async function inspectUploadedFile(
  file: File,
  minCharsPage: number = 80,
  minCharsSqInch: number = 1.2
): Promise<AuditRecord> {
  const buffer = await file.arrayBuffer();
  const sha256 = await calculateSha256(buffer);
  const md5 = calculateMd5(buffer);
  const sizeMb = Math.round((file.size / (1024 * 1024)) * 100) / 100;

  // Intentar parsear el PDF como texto crudo para encontrar firmas y marcas
  const decoder = new TextDecoder('latin1');
  const rawText = decoder.decode(new Uint8Array(buffer));

  // Verificar si es un PDF válido
  const isPdf = rawText.startsWith('%PDF-');
  if (!isPdf) {
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      archivo: file.name,
      ruta_o_origen: file.name,
      tamano_bytes: file.size,
      tamano_mb: sizeMb,
      md5,
      sha256,
      estado_general: 'ERROR_CORRUPTO',
      conforme_ocr: false,
      causa_raiz: 'El archivo no presenta una cabecera PDF válida (%PDF-).',
      accion_requerida: 'Verificar integridad o extensión del archivo.',
      total_paginas: 0,
      paginas_con_texto_valido: 0,
      paginas_solo_imagen_sin_ocr: 0,
      paginas_texto_deficiente: 0,
      paginas_en_blanco: 0,
      total_caracteres: 0,
      promedio_chars_por_pagina: 0,
      promedio_densidad_chars_sq_in: 0,
      total_imagenes_embebidas: 0,
      encriptado: false,
      permisos_lectura_extraer: false,
      metadatos_iso: {
        titulo: 'Archivo No Válido',
        autor: 'Desconocido',
        software_creador: 'N/A',
        productor_pdf: 'N/A',
        fecha_creacion: '',
        fecha_modificacion: '',
        version_formato: 'Inválido'
      },
      detalle_paginas: [],
      fecha_inspeccion: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
  }

  // Verificar encriptación
  const isEncrypted = rawText.includes('/Encrypt');

  // Conteo de páginas aproximado por '/Type /Page'
  const pageMatches = rawText.match(/\/Type\s*\/Page\b/g);
  let pageCount = pageMatches ? pageMatches.length : 1;
  // A veces hay catálogos con /Count N
  const countMatch = rawText.match(/\/Count\s+(\d+)/);
  if (countMatch && parseInt(countMatch[1], 10) > 0) {
    pageCount = Math.max(pageCount, parseInt(countMatch[1], 10));
  }
  pageCount = Math.max(1, Math.min(pageCount, 500)); // Limitar por seguridad

  // Extraer metadatos
  const titleMatch = rawText.match(/\/Title\s*\(([^)]+)\)/);
  const authorMatch = rawText.match(/\/Author\s*\(([^)]+)\)/);
  const creatorMatch = rawText.match(/\/Creator\s*\(([^)]+)\)/);
  const producerMatch = rawText.match(/\/Producer\s*\(([^)]+)\)/);
  const creationDateMatch = rawText.match(/\/CreationDate\s*\(([^)]+)\)/);

  const isoMetadata: ISOMetadata = {
    titulo: titleMatch ? titleMatch[1].replace(/\\/g, '') : file.name.replace('.pdf', ''),
    autor: authorMatch ? authorMatch[1].replace(/\\/g, '') : 'Desconocido',
    software_creador: creatorMatch ? creatorMatch[1].replace(/\\/g, '') : 'Genérico / Escáner',
    productor_pdf: producerMatch ? producerMatch[1].replace(/\\/g, '') : 'PDF Engine',
    fecha_creacion: creationDateMatch ? creationDateMatch[1] : new Date().toISOString(),
    fecha_modificacion: new Date().toISOString(),
    version_formato: rawText.substring(0, 8).trim()
  };

  // Detectar objetos de imagen (/Subtype /Image o /XObject)
  const imageMatches = rawText.match(/\/Subtype\s*\/Image/g);
  const imageCount = imageMatches ? imageMatches.length : 0;

  // Extraer bloques de texto en streams (BT ... ET)
  const textStreamMatches = rawText.match(/BT[\s\S]*?ET/g) || [];
  let extractedRawChars = 0;
  for (const block of textStreamMatches) {
    // Extraer strings entre paréntesis (texto)
    const strings = block.match(/\((.*?)\)/g) || [];
    for (const str of strings) {
      extractedRawChars += str.length - 2;
    }
  }

  // Generar desglose página a página
  const pageDetails: PageDetail[] = [];
  let paginasConTexto = 0;
  let paginasSoloImagen = 0;
  let paginasDeficientes = 0;
  const charsPerPage = pageCount > 0 ? Math.floor(extractedRawChars / pageCount) : 0;
  const pageAreaSqIn = 93.5; // Tamaño A4 promedio en sq inches

  for (let i = 1; i <= pageCount; i++) {
    // Si no hay texto extraído pero hay imágenes, es escaneado
    let pageChars = charsPerPage;
    let imgInPage = Math.ceil(imageCount / pageCount);

    if (extractedRawChars === 0) {
      pageChars = 0;
    }

    const density = Math.round((pageChars / pageAreaSqIn) * 100) / 100;
    let estado: PageDetail['estado'] = 'TEXTO_VALIDO';

    if (pageChars === 0 && imgInPage > 0) {
      estado = 'SOLO_IMAGEN_SIN_OCR';
      paginasSoloImagen++;
    } else if (pageChars === 0 && imgInPage === 0) {
      estado = 'PAGINA_EN_BLANCO';
    } else if (pageChars < minCharsPage || density < minCharsSqInch) {
      estado = imgInPage > 0 ? 'TEXTO_DEFICIENTE_CON_IMAGEN' : 'BAJA_DENSIDAD_TEXTUAL';
      paginasDeficientes++;
    } else {
      paginasConTexto++;
    }

    pageDetails.push({
      pagina: i,
      caracteres: pageChars,
      densidad_sq_in: density,
      imagenes: imgInPage,
      dimensiones_in: '8.3x11.7',
      estado
    });
  }

  // Determinar estado general
  let generalStatus: GeneralStatus = 'CONFORME_OCR';
  let conformeOcr = true;
  let causaRaiz = 'Capa de texto íntegra y legible. Supera los umbrales de densidad ISO.';
  let accionRequerida = 'Ninguna. Apto para indexación y búsqueda documental.';

  if (isEncrypted) {
    generalStatus = 'BLOQUEADO / ENCRIPTADO';
    conformeOcr = false;
    causaRaiz = 'Documento protegido con contraseña de usuario o clave de cifrado.';
    accionRequerida = 'Desproteger o proveer clave de descifrado previo al OCR.';
  } else if (paginasSoloImagen === pageCount) {
    generalStatus = 'REQUIERE_OCR_TOTAL';
    conformeOcr = false;
    causaRaiz = `Documento escaneado al 100%: ${pageCount} página(s) contienen solo imágenes rasterizadas sin capa OCR.`;
    accionRequerida = 'Procesar con motor OCR (Tesseract / Cloud Vision) completo.';
  } else if (paginasSoloImagen > 0 || paginasDeficientes > pageCount * 0.3) {
    generalStatus = 'REQUIERE_OCR_PARCIAL';
    conformeOcr = false;
    causaRaiz = `Documento mixto: ${paginasSoloImagen} página(s) son imágenes puras y ${paginasDeficientes} presentan densidad deficiente.`;
    accionRequerida = 'Re-OCRizar páginas identificadas o re-escanear anexos.';
  } else if (extractedRawChars < minCharsPage * pageCount * 0.5) {
    generalStatus = 'TEXTO_INSUFICIENTE';
    conformeOcr = false;
    causaRaiz = `Densidad textual global deficiente (${Math.round((extractedRawChars / (pageCount * pageAreaSqIn)) * 100) / 100} c/in²).`;
    accionRequerida = 'Inspeccionar manualmente y aplicar OCR de alta precisión.';
  }

  const avgDensity = Math.round((extractedRawChars / (pageCount * pageAreaSqIn)) * 100) / 100;

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    archivo: file.name,
    ruta_o_origen: file.name,
    tamano_bytes: file.size,
    tamano_mb: sizeMb,
    md5,
    sha256,
    estado_general: generalStatus,
    conforme_ocr: conformeOcr,
    causa_raiz: causaRaiz,
    accion_requerida: accionRequerida,
    total_paginas: pageCount,
    paginas_con_texto_valido: paginasConTexto,
    paginas_solo_imagen_sin_ocr: paginasSoloImagen,
    paginas_texto_deficiente: paginasDeficientes,
    paginas_en_blanco: 0,
    total_caracteres: extractedRawChars,
    promedio_chars_por_pagina: Math.round(extractedRawChars / pageCount),
    promedio_densidad_chars_sq_in: avgDensity,
    total_imagenes_embebidas: imageCount,
    encriptado: isEncrypted,
    permisos_lectura_extraer: !isEncrypted,
    metadatos_iso: isoMetadata,
    detalle_paginas: pageDetails,
    fecha_inspeccion: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
}

// Función para recalcular KPIs consolidados
export function calculateKPIs(records: AuditRecord[]) {
  const total = records.length;
  if (total === 0) {
    return {
      total_pdfs: 0,
      total_mb: 0,
      conformes: 0,
      pct_cumplimiento: 0,
      requieren_ocr_total: 0,
      requieren_ocr_parcial: 0,
      bloqueados: 0,
      total_paginas: 0,
      paginas_sin_ocr: 0,
      total_duplicados_grupos: 0,
      total_duplicados_archivos: 0
    };
  }

  const conformes = records.filter(r => r.conforme_ocr).length;
  const ocrTotal = records.filter(r => r.estado_general === 'REQUIERE_OCR_TOTAL').length;
  const ocrParcial = records.filter(r => r.estado_general === 'REQUIERE_OCR_PARCIAL' || r.estado_general === 'TEXTO_INSUFICIENTE').length;
  const bloqueados = records.filter(r => r.estado_general === 'BLOQUEADO / ENCRIPTADO' || r.estado_general === 'ERROR_CORRUPTO').length;
  const totalMb = Math.round(records.reduce((acc, r) => acc + r.tamano_mb, 0) * 100) / 100;
  const totalPaginas = records.reduce((acc, r) => acc + r.total_paginas, 0);
  const paginasSinOcr = records.reduce((acc, r) => acc + r.paginas_solo_imagen_sin_ocr, 0);

  // Duplicados
  const shaMap = new Map<string, string[]>();
  for (const r of records) {
    if (r.sha256) {
      const list = shaMap.get(r.sha256) || [];
      list.push(r.archivo);
      shaMap.set(r.sha256, list);
    }
  }

  let dupGroups = 0;
  let dupFiles = 0;
  for (const [, files] of shaMap) {
    if (files.length > 1) {
      dupGroups++;
      dupFiles += files.length;
    }
  }

  return {
    total_pdfs: total,
    total_mb: totalMb,
    conformes,
    pct_cumplimiento: Math.round((conformes / total) * 1000) / 10,
    requieren_ocr_total: ocrTotal,
    requieren_ocr_parcial: ocrParcial,
    bloqueados,
    total_paginas: totalPaginas,
    paginas_sin_ocr: paginasSinOcr,
    total_duplicados_grupos: dupGroups,
    total_duplicados_archivos: dupFiles
  };
}
