
/* ================================================================
   ARCHIVO: src/ui/components/buttons/Button.js
   ================================================================ */

/**
 * Button Component - Componente base para botones
 * Versión: 3.0.0 - Refactorizado con design system
 */

class Button {
  static variants = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    tertiary: 'btn btn-tertiary',
    danger: 'btn btn-danger',
    ghost: 'btn btn-ghost'
  };
  
  static sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  static create({
    variant = 'primary',
    size = 'md',
    icon = null,
    iconPosition = 'left',
    children,
    disabled = false,
    loading = false,
    fullWidth = false,
    action = null,
    className = '',
    type = 'button',
    ...props
  }) {
    const classes = [
      this.variants[variant],
      this.sizes[size],
      disabled && 'btn-disabled',
      loading && 'btn-loading',
      fullWidth && 'btn-full-width',
      className
    ].filter(Boolean).join(' ');

    const iconElement = icon ? `<span class="btn-icon">${icon}</span>` : '';
    const loadingElement = loading ? '<span class="btn-spinner"></span>' : '';
    
    const attributes = [
      `type="${type}"`,
      disabled && 'disabled',
      action && `data-action="${action}"`,
      ...Object.entries(props).map(([key, value]) => 
        key !== 'onClick' ? `${key}="${value}"` : ''
      )
    ].filter(Boolean).join(' ');

    return `
      <button class="${classes}" ${attributes}>
        ${loading ? loadingElement : ''}
        ${iconPosition === 'left' && !loading ? iconElement : ''}
        <span class="btn-content">${children}</span>
        ${iconPosition === 'right' && !loading ? iconElement : ''}
      </button>
    `;
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Button;
} else if (typeof window !== 'undefined') {
  window.Button = Button;
}