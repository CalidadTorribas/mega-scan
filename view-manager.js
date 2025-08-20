/**
 * ViewManager - Sistema de renderizado modular
 * Maneja todas las vistas de la aplicación de forma centralizada
 * Versión: 1.1.0 - Mejoras en UX y mensajes informativos
 */

class ViewManager {
    constructor(config = {}) {
        this.config = {
            appName: config.NAME || 'Mega||Scan',
            version: config.VERSION || '1.6.1',
            description: config.DESCRIPTION || 'La forma más rápida de obtener información de cualquier producto',
            ...config
        };
        
        this.icons = this.initializeIcons();
    }

    /**
     * Inicializar conjunto de iconos SVG
     */
    initializeIcons() {
        return {
            camera: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
            home: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
            search: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
            package: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
            arrowLeft: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>`,
            loader: `<svg class="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
            // CAMBIADO: Icono más suave para información en lugar de error
            infoCircle: `<svg class="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            // NUEVO: Icono específico para "no encontrado"
            searchX: `<svg class="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-6-6m0 6l6-6"/></svg>`,
            xCircle: `<svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            play: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293L12 11l.707-.707A1 1 0 0113.414 10H15M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            // NUEVO: Icono para escritorio sin cámara
            desktopComputer: `<svg class="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`
        };
    }

    /**
     * Generar imagen placeholder para productos
     */
    generatePlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg2M1Y5OEg4N1Y3NFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHlsZT0iZGlzcGxheTpibG9jazsgbWFyZ2luOmF1dG87Ij4KPHBhdGggZD0iTTMgNXYxNCIgc3Ryb2tlPSIjNjM2NTc3IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xNyA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi/+CjxwYXRoIGQ9Ik0yMSA1djE0IiBzdHJva2U9IiM2MzY1NzciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    }

    // ===== VISTA HOME =====
    renderHomeView() {
        return `
            <div class="flex flex-col items-center justify-center text-center p-8 h-full flex-1 relative fade-in">
                <div class="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl"></div>
                <div class="absolute bottom-20 right-10 w-32 h-32 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-xl"></div>
                
                <div class="mb-8 relative z-10">
                    <div class="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-lg mb-6 p-2">
                        <div class="w-full h-full flex items-center justify-center text-2xl font-bold">
                            <span class="text-blue-600">M</span>
                            <span class="text-blue-500 mx-1">||</span>
                            <span class="text-blue-400">S</span>
                        </div>
                    </div>
                </div>
                
                <h1 class="text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">${this.config.appName}</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-xs leading-relaxed">${this.config.description}</p>
                
                <div class="w-full max-w-xs space-y-4">
                    <button data-action="navigate-scanner" class="focus-ring w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg gap-3">
                        ${this.icons.camera} Iniciar Escáner
                    </button>
                </div>
                
                <div class="mt-16 text-center">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Versión ${this.config.version}</p>
                </div>
            </div>`;
    }

    // ===== VISTA SCANNER =====
    renderScannerView(scannerStatus = {}) {
        const needsActivation = scannerStatus.cameraPermissionStatus !== 'granted' || !scannerStatus.hasRequestedPermissionBefore;
        
        return `
            <div class="flex flex-col h-full flex-1 slide-up">
                ${this.renderHeader('Escanear Producto', true)}
                
                <div class="relative flex-1 bg-black flex items-center justify-center mx-4 mt-4 rounded-2xl overflow-hidden shadow-2xl">
                    <div id="qr-reader" class="w-full h-full bg-black ${needsActivation ? 'hidden' : ''}"></div>
                    
                    ${needsActivation ? this.renderCameraActivation(scannerStatus) : this.renderScannerTarget()}
                    
                    <div id="scanner-status" class="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent text-white text-center text-sm font-medium">
                        ${this.getScannerStatusMessage(scannerStatus)}
                    </div>
                </div>
                
                ${this.renderManualInput()}
            </div>`;
    }

    renderCameraActivation(scannerStatus) {
        const isDenied = scannerStatus.cameraPermissionStatus === 'denied';
        // MEJORADO: Detectar escritorio sin cámara por estado específico
        const isDesktopNoCamera = scannerStatus.cameraPermissionStatus === 'desktop_no_camera' || 
                                 (scannerStatus.lastErrorMessage && scannerStatus.lastErrorMessage.includes('No se detectó ninguna cámara en este dispositivo'));
        
        return `
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
                <div class="mb-6">
                    ${isDesktopNoCamera ? this.icons.desktopComputer : this.icons.camera.replace('w-6 h-6', 'w-16 h-16')}
                </div>
                <h3 class="text-xl font-semibold mb-4">
                    ${isDesktopNoCamera ? 'Sin Cámara Disponible' : 'Activar Cámara'}
                </h3>
                <p class="text-white/80 mb-6 text-sm leading-relaxed max-w-xs">
                    ${isDenied 
                        ? 'Los permisos fueron denegados. Ve a la configuración de tu navegador, permite el acceso a la cámara y recarga la página.'
                        : isDesktopNoCamera
                        ? 'No se detectó ninguna cámara en este dispositivo. Puedes introducir el código manualmente más abajo.'
                        : 'Para escanear códigos de barras necesitamos acceso a tu cámara.'
                    }
                </p>
                ${isDenied ? `
                    <button onclick="location.reload()" class="focus-ring bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200">
                        🔄 Recargar Página
                    </button>
                ` : isDesktopNoCamera ? `
                    <div class="text-white/60 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m0 7h14"/>
                        </svg>
                        Usar entrada manual
                    </div>
                ` : `
                    <button data-action="activate-camera" class="focus-ring bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 pulse-button">
                        ${this.icons.play} Activar Cámara
                    </button>
                `}
            </div>`;
    }

    renderScannerTarget() {
        return `
            <div class="absolute inset-0 flex items-center justify-center">
                <!-- MEJORADO: Área de escaneo más ancha (rectangular) -->
                <div class="w-4/5 max-w-sm" style="aspect-ratio: 1.6;">
                    <div class="absolute inset-0 border-2 border-white/30 rounded-2xl"></div>
                    <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl"></div>
                    <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-2xl"></div>
                    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-2xl"></div>
                    <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-2xl"></div>
                    <div class="scanner-overlay absolute inset-0 rounded-2xl"></div>
                </div>
            </div>`;
    }

    renderManualInput() {
        return `
            <div class="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-700/50">
                <div class="relative flex py-3 items-center mb-4">
                    <div class="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    <span class="flex-shrink mx-4 text-slate-500 dark:text-slate-400 text-sm font-medium">O introduce manualmente</span>
                    <div class="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                
                <form data-action="manual-submit" class="flex gap-3">
                    <input 
                        type="text" 
                        id="barcode-input" 
                        placeholder="Introduce el código aquí" 
                        class="focus-ring flex-1 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-700/90 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200" 
                        required
                        autocomplete="off"
                    >
                    <button 
                        type="submit" 
                        class="focus-ring bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:scale-95 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        ${this.icons.search}
                    </button>
                </form>
            </div>`;
    }

    getScannerStatusMessage(scannerStatus) {
        if (scannerStatus.cameraPermissionStatus === 'denied') {
            return 'Permisos denegados - Recarga la página';
        } else if (scannerStatus.cameraPermissionStatus === 'desktop_no_camera') {
            return 'Sin cámara disponible - Usar entrada manual';
        } else if (scannerStatus.cameraPermissionStatus !== 'granted' || !scannerStatus.hasRequestedPermissionBefore) {
            return 'Presiona "Activar Cámara" para comenzar';
        }
        return 'Preparando escáner...';
    }

    // ===== VISTA LOADING =====
    renderLoadingView(message = 'Cargando...') {
        return `
            <div class="flex flex-col items-center justify-center h-full text-center p-8 flex-1 relative fade-in">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50"></div>
                <div class="relative z-10">
                    <div class="mb-6">
                        ${this.icons.loader.replace('w-8 h-8', 'w-16 h-16 text-blue-600')}
                    </div>
                    <h3 class="text-xl font-semibold text-slate-800 dark:text-white mb-4">${message}</h3>
                    <div class="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div class="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>`;
    }

    // ===== VISTA PRODUCTO NO ENCONTRADO - NUEVA =====
    renderProductNotFoundView(barcode) {
        return `
            <div class="flex flex-col items-center justify-center h-full text-center p-8 flex-1 fade-in">
                <div class="mb-6">
                    ${this.icons.searchX}
                </div>
                <h3 class="text-xl font-semibold text-slate-800 dark:text-white mb-4">Producto No Encontrado</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-2 max-w-sm leading-relaxed">
                    El código de barras <strong>${barcode}</strong> no corresponde a ningún producto en nuestra base de datos.
                </p>
                <p class="text-slate-500 dark:text-slate-500 text-sm mb-8 max-w-sm">
                    Puedes intentar con otro código o contactar con soporte si crees que esto es un error.
                </p>
                <div class="flex gap-3 flex-wrap justify-center">
                    <button data-action="go-home" class="focus-ring bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200">
                        Escanear Otro
                    </button>
                    <button data-action="navigate-scanner" class="focus-ring bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all duration-200">
                        Reintentar
                    </button>
                </div>
            </div>`;
    }

    // ===== VISTA ERROR =====
    renderErrorView(message = 'Ha ocurrido un error') {
        const showReloadButton = message.includes('adblocker') || message.includes('librería') || 
                                message.includes('escáner') || message.includes('conexión');
        
        return `
            <div class="flex flex-col items-center justify-center h-full text-center p-8 flex-1 fade-in">
                <div class="mb-6">
                    ${this.icons.xCircle}
                </div>
                <h3 class="text-xl font-semibold text-slate-800 dark:text-white mb-4">Error Técnico</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">${message}</p>
                <div class="flex gap-3 flex-wrap justify-center">
                    <button data-action="go-home" class="focus-ring bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200">
                        Volver al Inicio
                    </button>
                    ${showReloadButton ? `
                        <button onclick="location.reload()" class="focus-ring bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200">
                            Recargar Página
                        </button>
                    ` : ''}
                </div>
            </div>`;
    }

    // ===== VISTA PRODUCTO =====
    renderProductView(product) {
        return `
            <div class="flex flex-col h-full flex-1 slide-up">
                ${this.renderHeader('Producto Encontrado', true)}
                
                <div class="flex-1 px-6 pb-6 overflow-auto">
                    ${this.renderProductImage(product)}
                    ${this.renderProductDetails(product)}
                </div>
                
                ${this.renderProductFooter()}
            </div>`;
    }

    renderProductImage(product) {
        return `
            <div class="w-full h-56 md:h-64 mb-6 mt-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner overflow-hidden border border-slate-200 dark:border-slate-600">
                <img src="${product.image_url || this.generatePlaceholderImage()}" 
                     alt="${product.Name || 'Producto'}" 
                     class="object-contain h-full w-full p-6" 
                     onerror="this.src='${this.generatePlaceholderImage()}'">
            </div>`;
    }

    renderProductDetails(product) {
        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-4">
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">${product.Name || 'Producto sin nombre'}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Código: ${product.Barcode || 'N/A'}</p>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-slate-500 dark:text-slate-400">ID:</span>
                        <p class="font-semibold text-slate-900 dark:text-white">${product.id || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-slate-500 dark:text-slate-400">Estado:</span>
                        <p class="font-semibold text-slate-900 dark:text-white">${product.Status || 'Activo'}</p>
                    </div>
                </div>
                
                ${product.Description ? `
                    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <span class="text-slate-500 dark:text-slate-400 text-sm">Descripción:</span>
                        <p class="text-slate-700 dark:text-slate-300 mt-1">${product.Description}</p>
                    </div>
                ` : ''}
            </div>`;
    }

    renderProductFooter() {
        return `
            <footer class="p-6 border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <div class="flex gap-3">
                    <button data-action="view-materials" class="focus-ring flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:scale-95 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                        ${this.icons.package} Ver Materiales
                    </button>
                    <button data-action="go-home" class="focus-ring flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all duration-200">
                        Nuevo Escaneo
                    </button>
                </div>
            </footer>`;
    }

    // ===== VISTA MATERIALES =====
    renderMaterialsView(product, materials) {
        return `
            <div class="flex flex-col h-full flex-1 slide-up">
                ${this.renderMaterialsHeader(product)}
                
                <div class="flex-1 overflow-auto p-4">
                    ${materials && materials.length > 0 ? 
                        this.renderMaterialsTable(materials) : 
                        this.renderNoMaterials()
                    }
                </div>
                
                ${this.renderMaterialsFooter()}
            </div>`;
    }

    renderMaterialsHeader(product) {
        return `
            <header class="p-4 flex items-center text-slate-800 dark:text-white backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-b border-slate-200/50 dark:border-slate-700/50">
                <button data-action="back-to-product" class="focus-ring p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95 mr-3">
                    ${this.icons.arrowLeft}
                </button>
                <div class="flex-1">
                    <h1 class="text-xl font-semibold">Materiales</h1>
                    <p class="text-sm text-slate-500 dark:text-slate-400 truncate">${product.Name}</p>
                </div>
            </header>`;
    }

    renderMaterialsTable(materials) {
        return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">ID Material</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">Descripción</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-600">
                            ${materials.map((material, index) => `
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-25 dark:bg-slate-800/50'}">
                                    <td class="px-4 py-3 text-sm font-mono text-slate-900 dark:text-slate-200 font-semibold">
                                        ${material.id}
                                    </td>
                                    <td class="px-4 py-3 text-sm">
                                        <div class="font-medium text-slate-900 dark:text-slate-200">${material.Description}</div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- MEJORADO: Sin notificación redundante, solo información visual -->
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div class="flex items-center mb-2">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span class="text-sm font-semibold text-blue-800 dark:text-blue-300">Información</span>
                </div>
                <p class="text-sm text-blue-700 dark:text-blue-300">
                    Se encontraron <strong>${materials.length}</strong> materiales para este producto.
                </p>
            </div>`;
    }

    renderNoMaterials() {
        return `
            <div class="flex flex-col items-center justify-center h-64 text-center">
                <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    ${this.icons.package.replace('w-6 h-6', 'w-8 h-8 text-slate-400')}
                </div>
                <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Sin materiales</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    No se encontraron materiales asociados a este producto.
                </p>
            </div>`;
    }

    renderMaterialsFooter() {
        return `
            <footer class="p-4 border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <div class="flex gap-3">
                    <button data-action="back-to-product" class="focus-ring flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all duration-200">
                        Volver al Producto
                    </button>
                    <button data-action="go-home" class="focus-ring flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg">
                        Inicio
                    </button>
                </div>
            </footer>`;
    }

    // ===== COMPONENTES AUXILIARES =====
    
    /**
     * Renderizar header común para vistas
     */
    renderHeader(title, showHomeButton = false) {
        return `
            <header class="p-6 text-center relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200/50 dark:border-slate-700/50">
                ${showHomeButton ? `
                    <button data-action="go-home" class="focus-ring absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-xl hover:bg-white/70 dark:hover:bg-slate-600/70 transition-all duration-200 active:scale-95">
                        ${this.icons.home}
                    </button>
                ` : ''}
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">${title}</h1>
            </header>`;
    }

    // ===== MÉTODOS PÚBLICOS =====

    /**
     * Renderizar vista según el estado - MEJORADO
     */
    render(viewType, data = {}) {
        try {
            switch (viewType) {
                case 'HOME':
                    return this.renderHomeView();
                    
                case 'SCANNER':
                    return this.renderScannerView(data.scannerStatus);
                    
                case 'LOADING':
                    return this.renderLoadingView(data.message);
                    
                case 'PRODUCT_NOT_FOUND': // NUEVO
                    return this.renderProductNotFoundView(data.barcode);
                    
                case 'ERROR':
                    return this.renderErrorView(data.message);
                    
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

    /**
     * Obtener icono por nombre
     */
    getIcon(name, customClass = '') {
        if (!this.icons[name]) {
            console.warn(`Icono '${name}' no encontrado`);
            return '';
        }
        
        return customClass ? 
            this.icons[name].replace('w-6 h-6', customClass) : 
            this.icons[name];
    }

    /**
     * Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewManager;
} else if (typeof window !== 'undefined') {
    window.ViewManager = ViewManager;
}