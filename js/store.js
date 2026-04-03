import { fetchProducts } from './parser.js';
import { parseTones, generateCartItemId } from './utils/tones.js';

const Store = {
  config: {
    sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmFcrcCDAZUmSEX97biUV5WYWDicJuLhjYF6UVEsfE0iWwJWZYF5XTEFwkVBaVkVMt8dtWrc7PkNyI/pub?output=csv',
    whatsappPhone: '+573054389882',
    cartKey: 'kara_cart'
  },
  
  state: {
    products: [],
    cart: [],
    loaded: false
  },
  
  listeners: {
    cart: [],
    products: []
  },
  
  async init() {
    if (this.state.loaded) return this.state.products;
    
    this.state.products = await fetchProducts(this.config.sheetCsvUrl);
    this.state.products = this.state.products.map(p => ({
      ...p,
      tonos: parseTones(p.tono),
      precio: parseFloat(p.precio) || 0,
      stock: parseInt(p.stock) || 0
    }));
    
    this.state.cart = this.loadCart();
    this.state.loaded = true;
    
    this.emit('products', this.state.products);
    this.emit('cart', this.state.cart);
    
    return this.state.products;
  },
  
  getProducts() {
    return this.state.products;
  },
  
  getProductById(id) {
    return this.state.products.find(p => p.id === id);
  },
  
  getProductsByCategory(category) {
    if (category === 'all') return this.state.products;
    return this.state.products.filter(p => p.categoria === category);
  },
  
  getCategories() {
    const categories = new Set(this.state.products.map(p => p.categoria).filter(Boolean));
    return ['all', ...Array.from(categories)];
  },
  
  /*getBrands() {
    const brands = new Set(this.state.products.map(p => p.marca).filter(Boolean));
    return Array.from(brands);
  },*/
  
  // 🆕 Búsqueda en múltiples campos
  searchProducts(query, category = 'all') {
    const searchTerm = query.toLowerCase().trim();
    let results = this.state.products;
    
    // Filtro por categoría
    if (category !== 'all') {
      results = results.filter(p => p.categoria === category);
    }
    
    // Filtro por búsqueda
    if (searchTerm) {
      results = results.filter(p => {
        const nombre = p.nombre?.toLowerCase() || '';
        const marca = p.marca?.toLowerCase() || '';
        const cat = p.categoria?.toLowerCase() || '';
        const descCorta = p.descripcion_corta?.toLowerCase() || '';
        const descLarga = (p.descripcion_larga?.slice(0, 500) || '').toLowerCase();
        
        return nombre.includes(searchTerm) ||
               marca.includes(searchTerm) ||
               cat.includes(searchTerm) ||
               descCorta.includes(searchTerm) ||
               descLarga.includes(searchTerm);
      });
    }
    
    return results;
  },
  
  loadCart() {
    try {
      return JSON.parse(localStorage.getItem(this.config.cartKey)) || [];
    } catch {
      return [];
    }
  },
  
  saveCart() {
    localStorage.setItem(this.config.cartKey, JSON.stringify(this.state.cart));
    this.emit('cart', this.state.cart);
  },
  
  getCart() {
    return this.state.cart;
  },
  
  // 🆕 Agregar con tono seleccionado
  addToCart(productId, qty = 1, selectedTone = null) {
    const product = this.getProductById(productId);
    if (!product) return false;
    
    // Determinar tono (por defecto: primero disponible)
    const tone = selectedTone || (product.tonos && product.tonos.length > 0 ? product.tonos[0] : null);
    
    const cartItemId = tone ? generateCartItemId(productId, tone.hex) : productId;
    const existing = this.state.cart.find(item => item.cartItemId === cartItemId);
    
    if (existing) {
      existing.qty += qty;
    } else {
      this.state.cart.push({
        cartItemId,
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen,
        qty: qty,
        tono: tone ? tone.hex : null,
        tonoNombre: tone ? tone.name : null
      });
    }
    
    this.saveCart();
    return true;
  },
  
  // 🆕 Actualizar tono en carrito (con fusión)
  updateCartTone(cartItemId, newToneHex, newToneName) {
    const item = this.state.cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;
    
    const newCartItemId = generateCartItemId(item.id, newToneHex);
    const existingSameTone = this.state.cart.find(i => 
      i.cartItemId === newCartItemId && i.cartItemId !== cartItemId
    );
    
    if (existingSameTone) {
      // Fusionar cantidades
      existingSameTone.qty += item.qty;
      this.state.cart = this.state.cart.filter(i => i.cartItemId !== cartItemId);
    } else {
      // Solo actualizar tono
      item.tono = newToneHex;
      item.tonoNombre = newToneName;
      item.cartItemId = newCartItemId;
    }
    
    this.saveCart();
  },
  
  updateQuantity(cartItemId, newQty) {
    const item = this.state.cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;
    
    if (newQty <= 0) {
      this.removeFromCart(cartItemId);
    } else {
      item.qty = newQty;
      this.saveCart();
    }
  },
  
  incrementQuantity(cartItemId, step = 1) {
    const item = this.state.cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;
    item.qty += step;
    this.saveCart();
  },
  
  decrementQuantity(cartItemId, step = 1) {
    const item = this.state.cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;
    item.qty -= step;
    if (item.qty <= 0) {
      this.removeFromCart(cartItemId);
    } else {
      this.saveCart();
    }
  },
  
  removeFromCart(cartItemId) {
    this.state.cart = this.state.cart.filter(i => i.cartItemId !== cartItemId);
    this.saveCart();
  },
  
  clearCart() {
    this.state.cart = [];
    localStorage.removeItem(this.config.cartKey);
    this.emit('cart', this.state.cart);
  },
  
  getCartTotal() {
    return this.state.cart.reduce((sum, item) => sum + (item.precio * item.qty), 0);
  },
  
  getCartCount() {
    return this.state.cart.reduce((sum, item) => sum + item.qty, 0);
  },
  
  generateWhatsAppMessage() {
    const items = this.state.cart.map(item => {
      const toneInfo = item.tonoNombre ? ` *-* Tono: ${item.tonoNombre}` : '';
      const subtotal = (item.precio || 0) * (item.qty || 0);
      return `• ${item.nombre}${toneInfo} x${item.qty} *-* ${this.formatPrice(subtotal)}`;
    }).join('\n');
    
    const total = this.formatPrice(this.getCartTotal());
    
    return `*_Pedido - Kara Maquillaje_*\n\n${items}\n\n*Total: ${total}*\n`;
  },
  
  getWhatsAppLink() {
    const message = this.generateWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${this.config.whatsappPhone}?text=${encoded}`;
  },
  
  formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  },
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  
  emit(event, data) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(cb => {
      try { cb(data); } catch (e) { console.error(`Error en listener ${event}:`, e); }
    });
  }
};

export { Store };