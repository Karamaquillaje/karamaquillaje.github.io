import { Store } from '../store.js';
import { formatPrice } from '../utils/format.js';

export function renderCart() {
  const cart = Store.getCart();
  
  if (cart.length === 0) {
    return `
      <div class="cart-view">
        <h2>🛒 Tu carrito</h2>
        <p class="empty">Tu carrito está vacío 😔</p>
        <button class="btn-continue" id="continue-shopping">Seguir comprando</button>
      </div>
    `;
  }
  
  const itemsHtml = cart.map(item => {
    const product = Store.getProductById(item.id);
    const hasTones = product?.tonos && product.tonos.length > 0;
    
    return `
      <li class="cart-item" data-id="${item.cartItemId}">
        <div class="cart-item-image">
          <img 
            src="images/productos/${item.imagen}" 
            alt="${item.nombre}"
            onerror="this.src='images/placeholder.webp'"
          />
        </div>
        <div class="cart-item-info">
          <h3>${item.nombre}</h3>
          ${item.tonoNombre ? `<p class="cart-item-tone">🎨 Tono: ${item.tonoNombre}</p>` : ''}
          <p class="cart-item-price">${formatPrice(item.precio)} c/u</p>
          <div class="cart-item-controls">
            <button class="qty-btn btn-decrease" data-id="${item.cartItemId}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn btn-increase" data-id="${item.cartItemId}">+</button>
            ${hasTones ? `
              <button class="btn-edit-tone" data-id="${item.cartItemId}">🎨 Cambiar tono</button>
            ` : ''}
            <button class="btn-remove" data-id="${item.cartItemId}">🗑️</button>
          </div>
        </div>
      </li>
    `;
  }).join('');
  
  const total = formatPrice(Store.getCartTotal());
  const count = Store.getCartCount();
  
  return `
    <div class="cart-view">
      <h2>🛒 Tu carrito (${count} productos)</h2>
      <ul class="cart-items">
        ${itemsHtml}
      </ul>
      
      <div class="cart-summary">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span>${total}</span>
        </div>
        <div class="cart-summary-row">
          <span>Envío</span>
          <span>A calcular</span>
        </div>
        <div class="cart-summary-row">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>
      
      <button class="btn-checkout" id="checkout-btn">
        💬 Pedir por WhatsApp
      </button>
      <button class="btn-continue" id="continue-shopping" style="margin-top: 1rem;">
        ← Seguir comprando
      </button>
    </div>
  `;
}

// 🆕 Renderizar modal de tonos
function renderToneModal(product, currentItem, onConfirm, onCancel) {
  const modal = document.createElement('div');
  modal.className = 'tone-modal hidden';
  modal.innerHTML = `
    <div class="tone-modal-content">
      <h3>🎨 Cambiar tono</h3>
      <p>Selecciona un nuevo tono para <strong>${product.nombre}</strong></p>
      <div class="tone-modal-swatches">
        ${product.tonos.map((tone, idx) => {
          const isCurrent = tone.hex === currentItem.tono;
          return `
            <button 
              class="tone-modal-swatch ${tone.available ? '' : 'unavailable'} ${isCurrent ? 'selected' : ''}" 
              style="background-color: ${tone.hex}"
              data-tone="${tone.hex}"
              data-tone-name="${tone.name}"
              title="${tone.name}${tone.stock !== null ? ' (' + tone.stock + ' disp.)' : ''}"
              ${!tone.available ? 'disabled' : ''}
            ></button>
          `;
        }).join('')}
      </div>
      <div class="tone-modal-actions">
        <button class="btn-tone-cancel">Cancelar</button>
        <button class="btn-tone-confirm" disabled>Confirmar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  let selectedTone = null;
  
  // Seleccionar swatch
  modal.querySelectorAll('.tone-modal-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      if (swatch.disabled) return;
      
      modal.querySelectorAll('.tone-modal-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      
      selectedTone = {
        hex: swatch.dataset.tone,
        name: swatch.dataset.toneName
      };
      
      modal.querySelector('.btn-tone-confirm').disabled = false;
    });
  });
  
  // Cancelar
  modal.querySelector('.btn-tone-cancel').addEventListener('click', () => {
    modal.remove();
    if (onCancel) onCancel();
  });
  
  // Confirmar
  modal.querySelector('.btn-tone-confirm').addEventListener('click', () => {
    if (!selectedTone) return;
    modal.remove();
    if (onConfirm) onConfirm(selectedTone);
  });
  
  // Mostrar modal
  setTimeout(() => modal.classList.remove('hidden'), 10);
}

export function initCartEvents(onContinue, onCheckout) {
  document.querySelectorAll('.btn-increase').forEach(btn => {
    btn.addEventListener('click', () => {
      const cartItemId = btn.dataset.id;
      if (cartItemId) Store.incrementQuantity(cartItemId);
    });
  });
  
  document.querySelectorAll('.btn-decrease').forEach(btn => {
    btn.addEventListener('click', () => {
      const cartItemId = btn.dataset.id;
      if (cartItemId) Store.decrementQuantity(cartItemId);
    });
  });
  
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const cartItemId = btn.dataset.id;
      if (cartItemId && confirm('¿Eliminar este producto?')) {
        Store.removeFromCart(cartItemId);
      }
    });
  });
  
  // 🆕 Editar tono
  document.querySelectorAll('.btn-edit-tone').forEach(btn => {
    btn.addEventListener('click', () => {
      const cartItemId = btn.dataset.id;
      const item = Store.getCart().find(i => i.cartItemId === cartItemId);
      const product = Store.getProductById(item.id);
      
      if (!product || !product.tonos) return;
      
      renderToneModal(
        product,
        item,
        (selectedTone) => {
          Store.updateCartTone(cartItemId, selectedTone.hex, selectedTone.name);
        },
        () => {}
      );
    });
  });
  
  const continueBtn = document.getElementById('continue-shopping');
  if (continueBtn && onContinue) {
    continueBtn.addEventListener('click', onContinue);
  }
  
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn && onCheckout) {
    checkoutBtn.addEventListener('click', onCheckout);
  }
}