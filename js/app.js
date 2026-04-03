import { Store } from './store.js';
import { renderHome, setupSearchInput } from './views/home.js';
import { renderProductDetail, initProductEvents } from './views/product.js';
import { renderCart, initCartEvents } from './views/cart.js';
import { renderInfo, initInfoEvents } from './views/info.js';

const App = {
  currentView: 'home',
  currentCategory: 'all',
  currentSearch: '',
  
  homeCallbacks: {
    onProductClick: null,
    onAddToCart: null,
    onFilterChange: null,
    onSearch: null
  },
  
  async init() {
    await Store.init();
    
    // 🆕 Inicializar delegación de eventos del home (UNA SOLA VEZ)
    this.initHomeDelegation();

    this.initBackButton();
    
    this.navigate('home');
    
    Store.on('cart', () => {
      this.updateCartFloat();
      if (this.currentView === 'cart') {
        this.navigate('cart');
      }
    });
    
    this.initCartFloat();
    this.initFooterEvents();
    this.updateCartFloat();
  },
  
  // 🆕 Delegación en DOCUMENT (nunca se re-renderiza) + Flag anti-doble-click
  initHomeDelegation() {
    // Flag global para evitar inicialización múltiple
    if (window.karaHomeDelegationInitialized) return;
    window.karaHomeDelegationInitialized = true;
    
    // Flag para prevenir doble ejecución en el mismo click
    let lastClickTime = 0;
    const CLICK_THROTTLE = 300; // ms
    
    // ✅ Delegación en document (máxima persistencia)
    document.addEventListener('click', (e) => {
      const now = Date.now();
      
      // Prevenir doble-click muy rápido
      if (now - lastClickTime < CLICK_THROTTLE) {
        return;
      }
      
      // Ignorar si el click fue en elementos que no nos interesan
      if (e.target.closest('.btn-add') || 
          e.target.closest('.tone-swatch') ||
          e.target.closest('.filter-btn') ||
          e.target.closest('.search-clear') ||
          e.target.id === 'search-input') {
        // Pero permitir que estos elementos manejen sus propios eventos
        return;
      }
      
      // 🎯 Navegar a producto: click en card completa
      const card = e.target.closest('.product-card');
      if (card && this.homeCallbacks.onProductClick) {
        const productId = card.dataset.id;
        if (productId) {
          e.preventDefault();
          e.stopPropagation();
          lastClickTime = now;
          this.homeCallbacks.onProductClick(productId);
        }
      }
    });
    
    // 🎨 Selección de tono
    document.addEventListener('click', (e) => {
      const swatch = e.target.closest('.tone-swatch');
      if (!swatch || swatch.disabled) return;
      
      e.stopPropagation();
      const card = swatch.closest('.product-card');
      card.querySelectorAll('.tone-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      
      const btn = card.querySelector('.btn-add');
      if (btn) {
        btn.dataset.selectedTone = swatch.dataset.tone;
        btn.dataset.selectedToneName = swatch.dataset.toneName;
      }
    });
    
    // 🛒 Agregar al carrito (con throttle integrado)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-add');
      if (!btn || btn.disabled) return;
      
      const now = Date.now();
      if (now - lastClickTime < CLICK_THROTTLE) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      const productId = btn.dataset.id;
      const selectedTone = btn.dataset.selectedTone ? {
        hex: btn.dataset.selectedTone,
        name: btn.dataset.selectedToneName
      } : null;
      
      if (productId && this.homeCallbacks.onAddToCart) {
        lastClickTime = now;
        this.homeCallbacks.onAddToCart(productId, selectedTone);
      }
    });
    
    // 🏷️ Filtros por categoría
    document.addEventListener('click', (e) => {
      const filterBtn = e.target.closest('.filter-btn');
      if (!filterBtn) return;
      
      const category = filterBtn.dataset.category;
      if (this.homeCallbacks.onFilterChange) {
        e.preventDefault();
        this.homeCallbacks.onFilterChange(category);
      }
    });
  },

  // 🆕 Comportamiento del botón "Atrás" del navegador
  initBackButton() {
    // Prevenir inicialización múltiple
    if (window.karaBackButtonInitialized) return;
    window.karaBackButtonInitialized = true;
    
    // Escuchar evento popstate (cuando el usuario presiona Atrás)
    window.addEventListener('popstate', (e) => {
      // Si estamos en Home, dejar que el navegador maneje el back (salir de la página)
      if (this.currentView === 'home') {
        return; // No prevenir default = comportamiento normal
      }
      
      // Si NO estamos en Home, navegar a Home e interceptar el back
      e.preventDefault();
      this.navigate('home');
      
      // Reemplazar el estado actual para evitar acumulación de historial
      // Así, el siguiente "Atrás" desde Home sí saldrá de la página
      history.replaceState({ view: 'home' }, '', window.location.href);
    });
    
    // 🆕 Manejar carga directa en URL no-home (ej: usuario entra a /?producto=1)
    // Si la URL tiene hash o params que indiquen otra vista, navegar ahí
    // (Para tu caso simple, asumimos que siempre inicia en home)
  },

  navigate(view, params = {}) {
    const app = document.getElementById('app');
    const previousView = this.currentView;
    
    // 🆕 Guardar scroll position si estamos en cart
    let savedScroll = 0;
    if (previousView === 'cart' || view === 'cart') {
      savedScroll = window.scrollY;
    }
    
    this.currentView = view;
    
    // Mostrar/ocultar carrito flotante y footer
    const cartFloat = document.getElementById('cart-float');
    const footer = document.getElementById('main-footer');
    
    if (view === 'cart') {
      cartFloat?.classList.add('hidden');
      footer?.classList.add('hidden');
    } else {
      cartFloat?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    }
    
    switch (view) {
      case 'home': {
        // 🆕 Guardar posición del cursor ANTES de re-renderizar
        const searchInput = document.getElementById('search-input');
        let cursorPosition = 0;
        let wasSearching = false;

        if (searchInput && document.activeElement === searchInput) {
          cursorPosition = searchInput.selectionStart;
          wasSearching = true;
        }
        
        // Re-renderizar contenido
        app.innerHTML = '';
        app.innerHTML = renderHome(this.currentCategory, this.currentSearch);
        
        if (wasSearching) {
          // 🆕 Restaurar foco y posición del cursor DESPUÉS de re-renderizar
          setTimeout(() => {
            const newInput = document.getElementById('search-input');
            if (newInput) {
              newInput.focus();
              const pos = Math.min(cursorPosition, newInput.value.length);
              newInput.setSelectionRange(pos, pos);
            }
          }, 10);
        }
        
        // Actualizar callbacks para delegación de eventos
        this.homeCallbacks.onProductClick = (id) => this.navigate('product', { id });
        this.homeCallbacks.onAddToCart = (id, tone) => this.addToCart(id, tone);
        this.homeCallbacks.onFilterChange = (category) => {
          this.currentCategory = category;
          this.navigate('home');
        };
        this.homeCallbacks.onSearch = (query) => {
          this.currentSearch = query;
          this.navigate('home');
        };
        
        setupSearchInput(this.homeCallbacks.onSearch, wasSearching);

        history.replaceState({ view: 'home' }, '', window.location.href);

        break;
      }
      
      case 'product': {
        if (previousView === 'home') {
          history.pushState({ view: 'product', id: params.id }, '', window.location.href);
        }
        
        const product = Store.getProductById(params.id);
        app.innerHTML = renderProductDetail(product);
        initProductEvents(
          () => this.navigate('home'),
          (id, tone) => this.addToCart(id, tone)
        );
        break;
      }
      
      case 'cart': {
        if (previousView === 'home') {
          history.pushState({ view: 'cart' }, '', window.location.href);
        }
        app.innerHTML = renderCart();
        initCartEvents(
          () => this.navigate('home'),
          () => this.checkout()
        );
        break;
      }
      
      case 'info': {
        if (previousView === 'home') {
          history.pushState({ view: 'info', page: params.page }, '', window.location.href);
        }
        app.innerHTML = renderInfo(params.page || 'how-to-buy');
        initInfoEvents(() => this.navigate('home'));
        break;
      }
    }
    
    // 🆕 Manejo inteligente del scroll
    setTimeout(() => {
      if (view === 'cart' && previousView === 'cart' && savedScroll > 0) {
        window.scrollTo(0, savedScroll);
      } else {
        window.scrollTo(0, 0);
      }
    }, 10);
  },
  
  addToCart(productId, selectedTone = null) {
    // 🛡️ Throttle de seguridad: evitar ejecuciones múltiples
    const now = Date.now();
    if (now - (this._lastAddToCartTime || 0) < 300) {
      return; // Ignorar si es muy rápido
    }
    this._lastAddToCartTime = now;
    
    const product = Store.getProductById(productId);
    
    if (!product || product.stock <= 0) {
      this.showToast('⚠️ Producto agotado');
      return;
    }
    
    const success = Store.addToCart(productId, 1, selectedTone);
    
    if (success) {
      const toneMsg = selectedTone ? ` - Tono: ${selectedTone.name}` : '';
      this.showToast(`✅ ${product.nombre}${toneMsg} agregado`);
      this.updateCartFloat();
    } else {
      this.showToast('❌ Error al agregar');
    }
  },
  
  updateCartFloat() {
    const cartFloat = document.getElementById('cart-float');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartFloat) return;
    
    const count = Store.getCartCount();
    const total = Store.getCartTotal();
    
    if (count === 0) {
      cartFloat.classList.add('hidden');
    } else {
      cartFloat.classList.remove('hidden');
      cartCount.textContent = `${count} producto${count > 1 ? 's' : ''}`;
      cartTotal.textContent = Store.formatPrice(total);
    }
  },
  
  initCartFloat() {
    const cartFloatBtn = document.getElementById('cart-float-btn');
    if (cartFloatBtn) {
      cartFloatBtn.addEventListener('click', () => this.navigate('cart'));
    }
  },
  
  initFooterEvents() {
    const linkHowToBuy = document.getElementById('link-how-to-buy');
    const linkAbout = document.getElementById('link-about');
    
    if (linkHowToBuy) {
      linkHowToBuy.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate('info', { page: 'how-to-buy' });
      });
    }
    
    if (linkAbout) {
      linkAbout.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate('info', { page: 'about' });
      });
    }
  },
  
  checkout() {
    const cart = Store.getCart();
    if (cart.length === 0) {
      this.showToast('⚠️ El carrito está vacío');
      return;
    }
    
    const link = Store.getWhatsAppLink();
    window.open(link, '_blank');
  },
  
  showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});