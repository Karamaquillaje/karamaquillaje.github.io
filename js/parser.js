/**
 * Parser CSV robusto que respeta comillas y comas dentro de campos
 */

/**
 * Parsea una línea de CSV respetando campos entre comillas
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      // Comilla escapada ""
      if (nextChar === '"') {
        current += '"';
        i++; // Saltar siguiente comilla
      } else {
        inQuotes = !inQuotes; // Toggle estado de comillas
      }
    } else if (char === ',' && !inQuotes) {
      // Solo separar por coma si NO estamos dentro de comillas
      values.push(current.trim());
      current = '';
    } else if (char === '\n' || char === '\r') {
      // Ignorar saltos de línea dentro del loop
    } else {
      current += char;
    }
  }
  
  // Agregar último valor
  values.push(current.trim());
  return values;
}

/**
 * Normaliza nombres de columnas (quita tildes, espacios, minúsculas)
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Parser CSV principal
 */
export function parseCSV(csvText) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;
  
  // Primero: separar líneas respetando comillas (por si hay saltos de línea en celdas)
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (nextChar === '"') {
        currentLine += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char === '\r') {
      // Ignorar \r
    } else {
      currentLine += char;
    }
  }
  
  // Última línea
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) {
    console.warn('⚠️ CSV sin datos válidos');
    return [];
  }
  
  // Parsear headers
  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);
  
  console.log('📋 Headers detectados:', headers); // DEBUG
  
  // Parsear datos
  const products = lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    const obj = {};
    
    headers.forEach((header, i) => {
      // Limpiar comillas residuales
      let value = values[i] || '';
      value = value.replace(/^"|"$/g, '').trim();
      obj[header] = value;
    });
    
    // DEBUG: mostrar primer producto
    if (index === 0) {
      console.log('📦 Primer producto parseado:', obj);
    }
    
    return obj;
  });
  
  return products;
}

/**
 * Carga productos desde Google Sheets CSV
 */
export async function fetchProducts(csvUrl) {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const csvText = await response.text();
    const products = parseCSV(csvText);
    
    // Procesar imágenes y datos numéricos
    return products.map(product => {
      // Soporte para 'imagen' (singular) o 'imagenes' (plural)
      const imagenesRaw = product.imagenes || product.imagen || '';
      const imagenes = imagenesRaw
        ? imagenesRaw.split('|').map(src => src.trim()).filter(Boolean)
        : [];
      
      return {
        ...product,
        imagenes,
        imagen: imagenes[0] || '',
        precio: parseFloat(product.precio) || 0,
        stock: parseInt(product.stock) || 0
      };
    });
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    return [];
  }
}