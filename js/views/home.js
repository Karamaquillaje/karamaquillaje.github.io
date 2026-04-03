import { Store } from '../store.js';
import { formatPrice } from '../utils/format.js';
import { getPreviewTones } from '../utils/tones.js';

/**
 * Renderiza la vista Home con grid de productos
 */
export function renderHome(activeCategory = 'all', searchQuery = '') {
  const products = Store.searchProducts(searchQuery, activeCategory);
  const categories = Store.getCategories();
  
  const searchHtml = `
    <div class="search-container">
      <input 
        type="text" 
        id="search-input" 
        class="search-input" 
        placeholder="🔍 Buscar..."
        value="${searchQuery}"
        autocomplete="off"
      />
      ${searchQuery ? '<button type="button" id="search-clear" class="search-clear">✕</button>' : ''}
    </div>
  `;
  
  const filtersHtml = `
    <nav class="filters">
      ${categories.map(cat => `
        <button type="button"
          class="filter-btn ${cat === activeCategory ? 'active' : ''}" 
          data-category="${cat}"
        >
          ${cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      `).join('')}
    </nav>
  `;
  
  const productsHtml = products.length > 0 
    ? `
      <section class="products-grid">
        ${products.map(product => {
          const hasTones = product.tonos && product.tonos.length > 0;
          const previewTones = hasTones ? getPreviewTones(product.tonos, 3) : null;

          const isOutOfStock = product.stock <= 0;
          const defaultTone = hasTones && product.tonos[0]?.available ? product.tonos[0] : null;
          
          return `
            <article class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${product.id}">
              <div class="product-image" data-id="${product.id}">
                <img 
                  src="images/productos/${product.imagen}" 
                  alt="${product.nombre}" 
                  loading="lazy"
                  onerror="this.src='images/placeholder.webp'"
                />
              </div>
              <div class="product-info">
                <h3>${product.nombre}</h3>
                ${product.marca ? `<p class="product-brand">${product.marca}</p>` : ''}
                <p class="price">${formatPrice(product.precio)}</p>
                <p class="desc">${product.descripcion_corta || ''}</p>
                
                ${hasTones ? `
                  <div class="tone-selector-mini">
                    ${previewTones.visible.map((tone, idx) => `
                      <button type="button"
                        class="tone-swatch ${tone.available ? '' : 'unavailable'} ${idx === 0 && tone.available ? 'selected' : ''}" 
                        style="background-color: ${tone.hex}"
                        data-tone="${tone.hex}"
                        data-tone-name="${tone.name}"
                        title="${tone.name}${tone.stock !== null ? ' (' + (tone.stock > 0? 'Disp.)' : 'No disp.)'): ''}"
                        ${!tone.available ? 'disabled' : ''}
                      ></button>
                    `).join('')}
                    ${previewTones.extra > 0 ? `
                      <span class="tone-extra">+${previewTones.extra}</span>
                    ` : ''}
                  </div>
                ` : ''}

                <button type="button"
                  class="btn-add" 
                  data-id="${product.id}" 
                  ${defaultTone ? `data-selected-tone="${defaultTone.hex}" data-selected-tone-name="${defaultTone.name}"` : ''}
                  ${isOutOfStock ? 'disabled' : ''}>
                  ${isOutOfStock ? 'Agotado' : 'Agregar'}
                </button>
              </div>
            </article>
          `;
        }).join('')}
      </section>
    `
    : '<p class="empty">🎨 No encontramos productos con esa búsqueda</p>';
  
  return `
    <header class="header">
      <div class="header-logo">
        <img src="images/logo.png" alt="Kara Maquillaje Logo" class="logo-img" />
      </div>
      <p class="subtitle">Tu tienda de maquilaje favorita, ahora digital</p>
    </header>
    <main>
      ${searchHtml}
      ${filtersHtml}
      ${productsHtml}
    </main>
  `;
}

export function setupSearchInput(onSearch, shouldFocus = false) {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  
  if (!searchInput || !onSearch) return;

  const newInput = searchInput.cloneNode(true);
  searchInput.parentNode?.replaceChild(newInput, searchInput);
  
  let debounceTimer;
  let lastValue = searchInput.value;

  newInput.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    if (currentValue === lastValue) return;
    lastValue = currentValue;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearch(currentValue);
      
      // ✅ Solo mantener foco si shouldFocus es true
      if (shouldFocus) {
        setTimeout(() => {
          const input = document.getElementById('search-input');
          if (input && document.activeElement !== input) {
            input.focus();
            const val = input.value;
            input.value = '';
            input.value = val;
          }
        }, 10);
      }
    }, 400);
  });

  if (searchClear) {
    searchClear.addEventListener('click', (e) => {
      e.stopPropagation();
      const input = document.getElementById('search-input');
      if (input) {
        input.value = '';
        onSearch('');
        if (shouldFocus) input.focus();
      }
    });
  }
  
  searchInput.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    if (currentValue === lastValue) return;
    lastValue = currentValue;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearch(currentValue);
      
      // Mantener foco
      setTimeout(() => {
        const input = document.getElementById('search-input');
        if (input && document.activeElement !== input) {
          input.focus();
          const val = input.value;
          input.value = '';
          input.value = val;
        }
      }, 50);
    }, 400);
  });
  
  if (searchClear) {
    searchClear.addEventListener('click', (e) => {
      e.stopPropagation();
      const input = document.getElementById('search-input');
      if (input) {
        input.value = '';
        onSearch('');
        input.focus();
      }
    });
  }
}