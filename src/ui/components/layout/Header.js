
/* ================================================================
   ARCHIVO: src/ui/components/layout/Header.js
   ================================================================ */

/**
 * Header Component - Cabecera consistente para todas las vistas
 * Versión: 3.0.0 - Sistema modular de navegación
 */

class Header {
  constructor(iconManager) {
    this.iconManager = iconManager;
  }

  create({
    title,
    subtitle = null,
    showBackButton = false,
    showHomeButton = false,
    actions = [],
    variant = 'default'
  }) {
    const navigation = this.renderNavigation(showBackButton, showHomeButton);
    const content = this.renderContent(title, subtitle);
    const actionButtons = this.renderActions(actions);

    return `
      <header class="header header-${variant}">
        ${navigation}
        ${content}
        ${actionButtons}
      </header>
    `;
  }

  renderNavigation(showBack, showHome) {
    if (!showBack && !showHome) return '';
    
    const backBtn = showBack ? `
      <button data-action="go-back" class="header-nav-btn" aria-label="Volver">
        ${this.iconManager.get('arrowLeft')}
      </button>
    ` : '';
    
    const homeBtn = showHome ? `
      <button data-action="go-home" class="header-nav-btn" aria-label="Inicio">
        ${this.iconManager.get('home')}
      </button>
    ` : '';

    return `
      <div class="header-nav">
        ${backBtn}${homeBtn}
      </div>
    `;
  }

  renderContent(title, subtitle) {
    return `
      <div class="header-content">
        <h1 class="header-title">${title}</h1>
        ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
      </div>
    `;
  }

  renderActions(actions) {
    if (!actions.length) return '';
    
    const actionButtons = actions.map(action => `
      <button 
        data-action="${action.action}" 
        class="header-action-btn"
        aria-label="${action.label || action.action}"
      >
        ${action.icon ? this.iconManager.get(action.icon) : ''}
        ${action.label ? `<span class="sr-only">${action.label}</span>` : ''}
      </button>
    `).join('');

    return `<div class="header-actions">${actionButtons}</div>`;
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Header;
} else if (typeof window !== 'undefined') {
  window.Header = Header;
}