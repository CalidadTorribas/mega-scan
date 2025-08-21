/* ================================================================
   ARCHIVO: src/ui/components/layout/Card.js
   ================================================================ */

/**
 * Card Component - Contenedor base para agrupar contenido
 * Versión: 3.0.0 - Sistema de variantes consistente
 */

class Card {
  static create({
    variant = 'default',
    padding = 'md',
    shadow = 'base',
    rounded = 'xl',
    border = true,
    children,
    className = '',
    interactive = false,
    ...props
  }) {
    const classes = [
      'card',
      `card-${variant}`,
      `card-padding-${padding}`,
      `card-shadow-${shadow}`,
      `card-rounded-${rounded}`,
      border && 'card-border',
      interactive && 'card-interactive',
      className
    ].filter(Boolean).join(' ');

    const attributes = Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `
      <div class="${classes}" ${attributes}>
        ${children}
      </div>
    `;
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Card;
} else if (typeof window !== 'undefined') {
  window.Card = Card;
}
