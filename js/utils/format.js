/**
 * Formatea precios en COP sin decimales
 */
export function formatPrice(price, locale = 'es-CO') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Formatea estado de stock
 */
export function formatStock(stock, toneStock = null) {
  const effectiveStock = toneStock !== null ? toneStock : stock;
  
  if (effectiveStock <= 0) {
    return { text: '❌ No disponible', class: 'stock-unavailable' };
  } else if (effectiveStock <= 5) {
    return { text: `⚠️ Quedan ${effectiveStock} unidades`, class: 'stock-low' };
  } else {
    return { text: '✅ Disponible', class: 'stock-available' };
  }
}