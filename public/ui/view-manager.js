/**
 * ViewManager v3.0 - Sistema de renderizado modular con identidad corporativa
 * Versión: 3.0.1 (Corregida) - Alineado con el Design System v3.0 y sus clases CSS.
 * Colores corporativos: Verde #4c8b2c | Marrón #5e3326
 */

class ViewManager {
    constructor(config = {}) {
        this.config = {
            appName: config.NAME || 'Mega||Scan',
            version: config.VERSION || '3.0.0',
            description: config.DESCRIPTION || 'La forma más rápida de obtener información de cualquier producto',
            ...config
        };
        
        this.initializeComponents();
    }

    initializeComponents() {
        this.iconManager = (typeof IconManager !== 'undefined') ? new IconManager() : null;
        this.Button = (typeof Button !== 'undefined') ? Button : null;
        this.Card = (typeof Card !== 'undefined') ? Card : null;
        this.Header = (typeof Header !== 'undefined') ? Header : null;
        
        const availableComponents = [
            this.iconManager && 'IconManager',
            this.Button && 'Button',
            this.Card && 'Card', 
            this.Header && 'Header'
        ].filter(Boolean);
        
        if (availableComponents.length > 0) {
            console.log(`✅ Design System v3.0 - Componentes disponibles: ${availableComponents.join(', ')}`);
        } else {
            console.log('⚠️ ViewManager funcionando en modo fallback (sin Design System)');
        }
    }

    getIcon(name, customClass = '') {
        if (this.iconManager) {
            return this.iconManager.get(name, customClass);
        }
        // Fallback simple si IconManager no carga
        return `<svg class="${customClass || 'w-6 h-6'}" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z"></path></svg>`;
    }
    
    generatePlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg2M1Y5OEg4N1Y3NFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHlsZT0iZGlzcGxheTpibG9jazsgbWFyZ2luOmF1dG87Ij4KPHBhdGggZD0iTTMgNXYxNCIgc3Ryb2tlPSIjNjM2NTc3IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi/+CjxwYXRoIGQ9Ik0xNyA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi/+CjxwYXRoIGQ9Ik0yMSA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi/+Cjwvc3ZnPgo8L3N2Zz4K';
    }

    // ===== VISTA HOME (Corregida) =====
    renderHomeView() {
        const logoComponent = `
            <div class="home-logo corporate-pulse">
                <img src="public/assets/images/logo300x157.svg" 
                     alt="Logo Corporativo" 
                     onerror="this.parentElement.innerHTML='<div class=\\'logo-fallback\\'><span style=\\'color: var(--color-primary-300);\\'>M</span><span style=\\'color: var(--color-primary-200); margin: 0 var(--spacing-1);\\'>||</span><span style=\\'color: var(--color-primary-100);\\'>S</span></div>'">
            </div>
        `;

        let scanButton;
        if (this.Button) {
            scanButton = this.Button.create({
                variant: 'primary',
                size: 'lg',
                icon: this.getIcon('camera'),
                children: 'Iniciar Escáner',
                action: 'navigate-scanner',
                fullWidth: true
            });
        } else {
            scanButton = `
                <button data-action="navigate-scanner" class="btn btn-primary btn-lg btn-full-width">
                    <span class="btn-icon">${this.getIcon('camera')}</span>
                    <span class="btn-content">Iniciar Escáner</span>
                </button>
            `;
        }

        return `
            <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--spacing-8); height: 100%;">
                
                ${logoComponent}
                
                <h1 class="text-corporate-gradient" style="font-size: var(--text-4xl); font-weight: var(--font-extrabold); margin-bottom: var(--spacing-4);">${this.config.appName}</h1>
                <p style="font-size: var(--text-lg); color: var(--color-text-secondary); margin-bottom: var(--spacing-12); max-width: 320px;">${this.config.description}</p>
                
                <div style="width: 100%; max-width: 320px;">
                    ${scanButton}
                </div>
                
                <div style="margin-top: var(--spacing-16); text-align: center;">
                    <p style="font-size: var(--text-sm); color: var(--color-text-tertiary);">Versión ${this.config.version}</p>
                </div>
            </div>`;
    }

    // ===== VISTA SCANNER (Corregida) =====
    renderScannerView(scannerStatus = {}) {
        const needsActivation = scannerStatus.cameraPermissionStatus !== 'granted' || !scannerStatus.hasRequestedPermissionBefore;
        const headerComponent = this.renderHeader('Escanear Producto', true);

        return `
            <div class="slide-up" style="display: flex; flex-direction: column; height: 100%;">
                ${headerComponent}
                
                <div class="scanner-frame" style="flex-grow: 1; margin: var(--spacing-4);">
                    <div id="qr-reader" style="width: 100%; height: 100%;" class="${needsActivation ? 'hidden' : ''}"></div>
                    
                    ${needsActivation ? this.renderCameraActivation(scannerStatus) : this.renderScannerTarget()}
                    
                    <div class="scanner-overlay">
                        <div id="scanner-status" class="scanner-status">
                            ${this.getScannerStatusMessage(scannerStatus)}
                        </div>
                    </div>
                </div>
                
                ${this.renderManualInput()}
            </div>`;
    }

    renderCameraActivation(scannerStatus) {
        const isDenied = scannerStatus.cameraPermissionStatus === 'denied';
        const isDesktopNoCamera = scannerStatus.cameraPermissionStatus === 'desktop_no_camera' || 
                                 (scannerStatus.lastErrorMessage && scannerStatus.lastErrorMessage.includes('No se detectó ninguna cámara en este dispositivo'));
        
        let activationButton;
        if (isDenied) {
            activationButton = `<button onclick="location.reload()" class="btn btn-primary">Recargar Página</button>`;
        } else if (!isDesktopNoCamera) {
            activationButton = `<button data-action="activate-camera" class="btn btn-primary corporate-pulse">Activar Cámara</button>`;
        } else {
            activationButton = ''; // No button if no camera
        }

        const iconClass = isDenied ? 'camera-activation-icon-error' : (isDesktopNoCamera ? 'camera-activation-icon-info' : 'camera-activation-icon-primary');
        const iconName = isDesktopNoCamera ? 'desktopComputer' : 'camera';

        return `
            <div class="camera-activation">
                <div class="camera-activation-content">
                    <div class="camera-activation-icon ${iconClass}">
                        ${this.getIcon(iconName, 'w-16 h-16')}
                    </div>
                    <h3 class="camera-activation-title">
                        ${isDesktopNoCamera ? 'Sin Cámara Disponible' : (isDenied ? 'Permiso Denegado' : 'Activar Cámara')}
                    </h3>
                    <p class="camera-activation-description">
                        ${isDenied 
                            ? 'Ve a la configuración de tu navegador, permite el acceso a la cámara y recarga la página.'
                            : isDesktopNoCamera
                            ? 'No se detectó ninguna cámara. Puedes introducir el código manualmente más abajo.'
                            : 'Para escanear códigos de barras necesitamos acceso a tu cámara.'
                        }
                    </p>
                    ${activationButton}
                </div>
            </div>`;
    }
    
    renderScannerTarget() {
        return `
            <div class="scanner-target">
                <div class="scanner-target-frame">
                    <div class="scanner-target-corner scanner-target-corner-tl"></div>
                    <div class="scanner-target-corner scanner-target-corner-tr"></div>
                    <div class="scanner-target-corner scanner-target-corner-bl"></div>
                    <div class="scanner-target-corner scanner-target-corner-br"></div>
                    <div class="scanner-sweep"></div>
                </div>
            </div>`;
    }

    renderManualInput() {
        return `
            <div style="padding: var(--spacing-4); border-top: 1px solid var(--color-border-secondary);">
                <p style="text-align: center; color: var(--color-text-secondary); font-size: var(--text-sm); margin-bottom: var(--spacing-3);">O introduce manualmente</p>
                <form data-action="manual-submit" style="display: flex; gap: var(--spacing-2);">
                    <input 
                        type="text" 
                        id="barcode-input" 
                        placeholder="Introduce el código aquí" 
                        class="form-input" 
                        style="flex-grow: 1;"
                        required
                        autocomplete="off"
                    >
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-icon">${this.getIcon('search')}</span>
                    </button>
                </form>
            </div>`;
    }

    getScannerStatusMessage(scannerStatus) {
        if (scannerStatus.cameraPermissionStatus === 'denied') return 'Permisos denegados - Recarga la página';
        if (scannerStatus.cameraPermissionStatus === 'desktop_no_camera') return 'Sin cámara disponible';
        if (scannerStatus.cameraPermissionStatus !== 'granted' || !scannerStatus.hasRequestedPermissionBefore) return 'Presiona "Activar Cámara"';
        return 'Apunte al código de barras';
    }

    // ===== VISTA LOADING (Corregida) =====
    renderLoadingView(message = 'Cargando...') {
        return `
            <div class="loading-spinner loading-spinner-fullpage fade-in">
                <div class="loading-spinner-icon loading-spinner-primary loading-spinner-lg">
                    ${this.getIcon('loader', 'animate-spin')}
                </div>
                <p class="loading-spinner-message">${message}</p>
            </div>`;
    }

    // ===== VISTA PRODUCTO NO ENCONTRADO (Corregida) =====
    renderProductNotFoundView(barcode) {
        return `
            <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--spacing-8); height: 100%;">
                <div style="margin-bottom: var(--spacing-4); color: var(--color-text-tertiary);">
                    ${this.getIcon('searchX', 'w-16 h-16')}
                </div>
                <h3 style="font-size: var(--text-xl); font-weight: var(--font-semibold); margin-bottom: var(--spacing-2);">Producto No Encontrado</h3>
                <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-1); max-width: 400px;">
                    El código <strong>${barcode}</strong> no está en nuestra base de datos.
                </p>
                 <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-bottom: var(--spacing-6); max-width: 400px;">
                    Intenta con otro código o contacta con soporte si crees que esto es un error.
                </p>
                <div style="display: flex; gap: var(--spacing-3);">
                    <button data-action="go-home" class="btn btn-primary">Escanear Otro</button>
                    <button data-action="navigate-scanner" class="btn btn-secondary">Reintentar</button>
                </div>
            </div>`;
    }

    // ===== VISTA ERROR (Corregida) =====
    renderErrorView(message = 'Ha ocurrido un error') {
        return `
            <div class="fade-in status-message status-message-error" style="margin: var(--spacing-8);">
                 <div class="status-message-icon">${this.getIcon('xCircle')}</div>
                 <div class="status-message-content">
                    <h3 class="status-message-title">Error Técnico</h3>
                    <p class="status-message-text">${message}</p>
                    <div class="status-message-actions">
                         <button data-action="go-home" class="btn btn-danger">Volver al Inicio</button>
                         <button data-action="reload-page" class="btn btn-tertiary">Recargar</button>
                    </div>
                 </div>
            </div>
        `;
    }

    // ===== VISTA PRODUCTO (Corregida) =====
    renderProductView(product) {
        const headerComponent = this.renderHeader('Producto Encontrado', true);

        return `
            <div class="slide-up" style="display: flex; flex-direction: column; height: 100%;">
                ${headerComponent}
                <div style="flex-grow: 1; overflow-y: auto; padding: var(--spacing-6);">
                    ${this.renderProductImage(product)}
                    ${this.renderProductDetails(product)}
                </div>
                ${this.renderProductFooter()}
            </div>`;
    }

    renderProductImage(product) {
        return `
            <div class="card card-padding-md" style="margin-bottom: var(--spacing-6);">
                <img src="${product.image_url || this.generatePlaceholderImage()}" 
                     alt="${product.Name || 'Producto'}" 
                     style="object-fit: contain; width: 100%; height: 14rem;"
                     onerror="this.src='${this.generatePlaceholderImage()}'">
            </div>`;
    }

    renderProductDetails(product) {
        return `
            <div class="card card-elevated card-padding-lg">
                <h2 style="font-size: var(--text-2xl); font-weight: var(--font-bold); margin-bottom: var(--spacing-2);">${product.Name || 'Producto sin nombre'}</h2>
                <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-bottom: var(--spacing-4);">Código: ${product.Barcode || 'N/A'}</p>
                
                <div style="display: flex; gap: var(--spacing-4); font-size: var(--text-sm); margin-bottom: var(--spacing-4);">
                    <div>
                        <span style="color: var(--color-text-secondary);">ID:</span>
                        <p style="font-weight: var(--font-semibold);">${product.id || 'N/A'}</p>
                    </div>
                    <div>
                        <span style="color: var(--color-text-secondary);">Estado:</span>
                        <p style="font-weight: var(--font-semibold);">${product.Status || 'Activo'}</p>
                    </div>
                </div>
                
                ${product.Description ? `
                    <div style="border-top: 1px solid var(--color-border-primary); padding-top: var(--spacing-4);">
                        <span style="color: var(--color-text-secondary); font-size: var(--text-sm);">Descripción:</span>
                        <p style="color: var(--color-text-primary); margin-top: var(--spacing-1);">${product.Description}</p>
                    </div>
                ` : ''}
            </div>`;
    }

    renderProductFooter() {
        return `
            <footer style="padding: var(--spacing-4); border-top: 1px solid var(--color-border-secondary);">
                <div style="display: flex; gap: var(--spacing-3);">
                    <button data-action="view-materials" class="btn btn-primary btn-full-width">
                        <span class="btn-icon">${this.getIcon('package')}</span>
                        <span class="btn-content">Ver Materiales</span>
                    </button>
                    <button data-action="go-home" class="btn btn-secondary btn-full-width">
                        Nuevo Escaneo
                    </button>
                </div>
            </footer>`;
    }

    // ===== VISTA MATERIALES (Corregida) =====
    renderMaterialsView(product, materials) {
        const headerComponent = `
            <header class="header">
                <div class="header-nav">
                    <button data-action="back-to-product" class="header-nav-btn">
                        ${this.getIcon('arrowLeft')}
                    </button>
                </div>
                <div class="header-content">
                    <h1 class="header-title">Materiales</h1>
                    <p class="header-subtitle">${product.Name}</p>
                </div>
                 <div class="header-actions" style="width: 2.5rem;"></div> <!-- Placeholder for alignment -->
            </header>
        `;

        return `
            <div class="slide-up" style="display: flex; flex-direction: column; height: 100%;">
                ${headerComponent}
                <div style="flex-grow: 1; overflow-y: auto; padding: var(--spacing-6);">
                    ${(materials && materials.length > 0) ? this.renderMaterialsList(materials) : this.renderNoMaterials()}
                </div>
            </div>`;
    }

    renderMaterialsList(materials) {
        const materialItems = materials.map(material => `
            <div class="card card-border" style="padding: var(--spacing-3) var(--spacing-4); display: flex; align-items: center; gap: var(--spacing-4);">
                <div style="color: var(--color-primary-500);">${this.getIcon('package')}</div>
                <div>
                    <p style="font-weight: var(--font-medium);">${material.Description}</p>
                    <p style="font-size: var(--text-sm); color: var(--color-text-secondary);">ID: ${material.id}</p>
                </div>
            </div>
        `).join('');

        return `<div style="display: flex; flex-direction: column; gap: var(--spacing-3);">${materialItems}</div>`;
    }

    renderNoMaterials() {
        return `
            <div class="card card-padding-xl" style="text-align: center;">
                <div style="color: var(--color-text-tertiary); display: inline-block; margin-bottom: var(--spacing-4);">
                     ${this.getIcon('package', 'w-12 h-12')}
                </div>
                <h3 style="font-size: var(--text-lg); font-weight: var(--font-semibold); margin-bottom: var(--spacing-2);">Sin materiales</h3>
                <p style="color: var(--color-text-secondary); max-width: 300px; margin: auto;">
                    No se encontraron materiales asociados a este producto.
                </p>
            </div>`;
    }

    // ===== COMPONENTES AUXILIARES (Corregido) =====
    renderHeader(title, showHomeButton = false) {
        return `
            <header class="header">
                <div class="header-nav">
                    ${showHomeButton ? `
                        <button data-action="go-home" class="header-nav-btn">
                           ${this.getIcon('home')}
                        </button>
                    ` : '<div style="width: 2.5rem;"></div>'} <!-- Placeholder for alignment -->
                </div>
                <div class="header-content">
                    <h1 class="header-title">${title}</h1>
                </div>
                <div class="header-actions" style="width: 2.5rem;"></div> <!-- Placeholder for alignment -->
            </header>`;
    }

    // ===== MÉTODO PRINCIPAL DE RENDERIZADO =====
    render(viewType, data = {}) {
        try {
            switch (viewType) {
                case 'HOME': return this.renderHomeView();
                case 'SCANNER': return this.renderScannerView(data.scannerStatus);
                case 'LOADING': return this.renderLoadingView(data.message);
                case 'PRODUCT_NOT_FOUND': return this.renderProductNotFoundView(data.barcode);
                case 'ERROR': return this.renderErrorView(data.message);
                case 'PRODUCT':
                    if (!data.product) throw new Error('Producto requerido para vista PRODUCT');
                    return this.renderProductView(data.product);
                case 'MATERIALS':
                    if (!data.product) throw new Error('Producto requerido para vista MATERIALS');
                    return this.renderMaterialsView(data.product, data.materials);
                default:
                    console.warn(`Vista desconocida: ${viewType}. Renderizando HOME por defecto.`);
                    return this.renderHomeView();
            }
        } catch (error) {
            console.error('Error renderizando vista:', error);
            return this.renderErrorView('Error inesperado en la aplicación');
        }
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewManager;
} else if (typeof window !== 'undefined') {
    window.ViewManager = ViewManager;
}