/**
 * Parser de tonos con formato: #HEX:Nombre:Stock
 * Ej: "#CC0000:Vino:7" o "#FF0000:Rojo" (stock opcional)
 */

export function parseTones(tonesString) {
  if (!tonesString || tonesString.trim() === '') {
    return [];
  }
  
  return tonesString.split('|').map(toneStr => {
    const parts = toneStr.trim().split(':');
    const hex = parts[0]?.trim() || '';
    const name = parts[1]?.trim() || 'Sin nombre';
    const stock = parts[2] ? parseInt(parts[2]) : null;
    
    return {
      hex,
      name,
      stock,
      available: stock === null || stock > 0
    };
  }).filter(t => t.hex);
}

/**
 * Obtiene los primeros N tonos para mostrar en Home
 */
export function getPreviewTones(tones, limit = 3) {
  if (tones.length <= limit) {
    return { visible: tones, extra: 0 };
  }
  return {
    visible: tones.slice(0, limit),
    extra: tones.length - limit
  };
}

/**
 * Genera ID único para carrito basado en producto + tono
 */
export function generateCartItemId(productId, toneHex) {
  return `${productId}-${toneHex}`;
}