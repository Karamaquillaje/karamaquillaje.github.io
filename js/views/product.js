import { formatPrice, formatStock } from '../utils/format.js';

export function renderProductDetail(product) {
  if (!product) {
    return `
      <div class="product-detail">
        <button class="back-btn" id="back-btn">← Volver</button>
        <p class="empty">Producto no encontrado</p>
      </div>
    `;
  }
  
  const imagenes = product.imagenes && product.imagenes.length > 0 
    ? product.imagenes 
    : [product.imagen];
  
  const hasMultipleImages = imagenes.length > 1;
  const hasTones = product.tonos && product.tonos.length > 0;
  
  const carouselHtml = `
    <div class="carousel">
      ${hasMultipleImages ? `
        <button class="carousel-arrow prev" aria-label="Imagen anterior">❮</button>
        <button class="carousel-arrow next" aria-label="Imagen siguiente">❯</button>
      ` : ''}
      <div class="carousel-track" id="carousel-track">
        ${imagenes.map((img, idx) => `
          <div class="carousel-slide">
            <img 
              src="images/productos/${img}" 
              alt="${product.nombre} - Imagen ${idx + 1}"
              onerror="this.src='images/placeholder.webp'"
            />
          </div>
        `).join('')}
      </div>
      ${hasMultipleImages ? `
        <div class="carousel-indicators">
          ${imagenes.map((_, idx) => `
            <button class="carousel-indicator ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Ir a imagen ${idx + 1}"></button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  const toneSelectorHtml = hasTones ? `
    <div class="tone-selector">
      <h4>🎨 Tonos disponibles</h4>
      <div class="tone-swatches">
        ${product.tonos.map((tone, idx) => {
          const stockInfo = formatStock(product.stock, tone.stock);
          return `
            <button 
              class="tone-swatch-large ${tone.available ? '' : 'unavailable'} ${idx === 0 ? 'selected' : ''}" 
              style="background-color: ${tone.hex}"
              data-tone="${tone.hex}"
              data-tone-name="${tone.name}"
              title="${tone.name}${tone.stock !== null ? ' - ' + stockInfo.text : ''}"
              ${!tone.available ? 'disabled' : ''}
            >
              ${!tone.available ? '✕' : ''}
            </button>
          `;
        }).join('')}
      </div>
      <p class="selected-tone-info" id="selected-tone-info">
        Tono seleccionado: <strong>${product.tonos[0]?.name || 'N/A'}</strong>
      </p>
    </div>
  ` : '';
  
  const stockInfo = formatStock(product.stock);
  
  const infoHtml = `
    <div class="product-detail-info">
      <h2>${product.nombre}</h2>
      ${product.marca ? `<p class="product-brand-large">${product.marca}</p>` : ''}
      <p class="product-detail-price">${formatPrice(product.precio)}</p>
      
      <div class="stock-status ${stockInfo.class}">
        ${stockInfo.text}
      </div>
      
      <div class="product-detail-desc">${product.descripcion_larga || product.descripcion || ''}</div>
      
      ${hasTones ? toneSelectorHtml : ''}
      
      <div class="product-detail-meta">
        ${product.sku ? `<p>🏷️ <strong>SKU:</strong> ${product.sku}</p>` : ''}
        ${product.categoria ? `<p>📂 <strong>Categoría:</strong> ${product.categoria}</p>` : ''}
      </div>
      
      <button class="btn-add-to-cart" ${product.stock <= 0 ? 'disabled' : ''} data-id="${product.id}">
        ${product.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  `;
  
  return `
    <div class="product-detail">
      <button class="back-btn" id="back-btn">← Volver</button>
      ${carouselHtml}
      ${infoHtml}
    </div>
  `;
}

export function initProductEvents(onBack, onAddToCart) {
  let selectedTone = null;
  
  const backBtn = document.getElementById('back-btn');
  if (backBtn && onBack) {
    backBtn.addEventListener('click', onBack);
  }
  
  // Selector de tonos
  document.querySelectorAll('.tone-swatch-large').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.tone-swatch-large').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      
      selectedTone = {
        hex: swatch.dataset.tone,
        name: swatch.dataset.toneName
      };
      
      const info = document.getElementById('selected-tone-info');
      if (info) {
        info.innerHTML = `Tono seleccionado: <strong>${selectedTone.name}</strong>`;
      }

      scrollToColorPalette();
    });
  });
  
  // Botón agregar
  const addBtn = document.querySelector('.btn-add-to-cart');
  if (addBtn && onAddToCart) {
    addBtn.addEventListener('click', () => {
      const productId = addBtn.dataset.id;
      if (productId) onAddToCart(productId, selectedTone);
    });
  }
  
  // Carrusel
  const track = document.getElementById('carousel-track');
  const indicators = document.querySelectorAll('.carousel-indicator');
  const prevBtn = document.querySelector('.carousel-arrow.prev');
  const nextBtn = document.querySelector('.carousel-arrow.next');
  
  if (track && indicators.length > 0) {
    function updateActiveIndicator() {
      const slideWidth = track.offsetWidth;
      const currentIndex = Math.round(track.scrollLeft / slideWidth);
      indicators.forEach((ind, idx) => {
        ind.classList.toggle('active', idx === currentIndex);
      });
    }
    
    indicators.forEach(indicator => {
      indicator.addEventListener('click', () => {
        const index = parseInt(indicator.dataset.index);
        const slideWidth = track.offsetWidth;
        track.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
      });
    });
    
    track.addEventListener('scroll', updateActiveIndicator);
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const slideWidth = track.offsetWidth;
        const currentIndex = Math.round(track.scrollLeft / slideWidth);
        const newIndex = Math.max(0, currentIndex - 1);
        track.scrollTo({ left: slideWidth * newIndex, behavior: 'smooth' });
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const slideWidth = track.offsetWidth;
        const currentIndex = Math.round(track.scrollLeft / slideWidth);
        const maxIndex = indicators.length - 1;
        const newIndex = Math.min(maxIndex, currentIndex + 1);
        track.scrollTo({ left: slideWidth * newIndex, behavior: 'smooth' });
      });
    }
  }
}

/**
 * Scroll del carrusel a la última imagen (paleta de colores)
 */
function scrollToColorPalette() {
  const track = document.getElementById('carousel-track');
  if (!track) return;
  
  const slides = track.querySelectorAll('.carousel-slide');
  if (slides.length <= 1) return; // No hacer nada si solo hay 1 imagen
  
  // Scroll a la última imagen
  const lastSlideIndex = slides.length - 1;
  const slideWidth = track.offsetWidth;
  track.scrollTo({ 
    left: slideWidth * lastSlideIndex, 
    behavior: 'smooth' 
  });
  
  // Actualizar indicador activo
  const indicators = document.querySelectorAll('.carousel-indicator');
  indicators.forEach((ind, idx) => {
    ind.classList.toggle('active', idx === lastSlideIndex);
  });
}