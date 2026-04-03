/**
 * Renderiza la vista de información (Cómo Comprar, Redes, etc.)
 */
export function renderInfo(page = 'how-to-buy') {
  const content = {
    'how-to-buy': {
      title: '🛒 ¿Cómo comprar?',
      body: `
        <div class="info-steps">
          <div class="info-step">
            <span class="step-number">1</span>
            <div class="step-content">
              <h3>Explora el catálogo</h3>
              <p>Navega por nuestros productos y filtra por categoría para encontrar lo que buscas.</p>
            </div>
          </div>
          <div class="info-step">
            <span class="step-number">2</span>
            <div class="step-content">
              <h3>Agrega al carrito</h3>
              <p>Selecciona los productos que deseas y agrégalos a tu carrito de compras.</p>
            </div>
          </div>
          <div class="info-step">
            <span class="step-number">3</span>
            <div class="step-content">
              <h3>Revisa tu pedido</h3>
              <p>Ve al carrito, ajusta las cantidades y verifica el total de tu compra.</p>
            </div>
          </div>
          <div class="info-step">
            <span class="step-number">4</span>
            <div class="step-content">
              <h3>Pide por WhatsApp</h3>
              <p>Haz clic en "Pedir por WhatsApp" y envíanos tu pedido. Te confirmaremos disponibilidad y coordinaremos la entrega.</p>
            </div>
          </div>
        </div>
        <div class="info-note">
          <p>💡 <strong>Nota:</strong> Los pedidos se coordinan directamente por WhatsApp. Respondemos en el menor tiempo posible.</p>
        </div>
      `
    },
    'about': {
      title: '💜 Sobre Kara Maquillaje',
      body: `
        <p>Somos una tienda que lleva el amor por el maquillaje hasta donde estés. Productos seleccionados con cariño para resaltar tu belleza natural.</p>
        <br>
        <p>📍 <strong>Ubicación:</strong> Ipiales, Nariño</p>
        <p>🕒 <strong>Horario:</strong> Lunes a Sábado de 9:00 a 20:00</p>
        <p>📦 <strong>Envíos:</strong> Coordinar por WhatsApp</p>
      `
    }
  };
  
  const pageData = content[page] || content['how-to-buy'];
  
  return `
    <div class="info-view">
      <button class="back-btn" id="back-btn">← Volver</button>
      <h2>${pageData.title}</h2>
      <div class="info-content">
        ${pageData.body}
      </div>
    </div>
  `;
}

export function initInfoEvents(onBack) {
  const backBtn = document.getElementById('back-btn');
  if (backBtn && onBack) {
    backBtn.addEventListener('click', onBack);
  }
}