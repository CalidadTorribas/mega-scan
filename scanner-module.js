/**
 * Módulo Scanner - Gestión completa del escáner de códigos de barras
 * Versión: 1.0.0
 */

class ScannerModule {
    constructor() {
        this.activeCodeReader = null;
        this.qrCodeLibrary = null;
        this.cameraPermissionStatus = 'unknown'; // 'unknown', 'granted', 'denied', 'prompt'
        this.isInitialized = false;
        
        // Callbacks externos que se pueden configurar
        this.callbacks = {
            onScanSuccess: null,
            onScanError: null,
            onPermissionChange: null,
            onStatusUpdate: null
        };

        // Configuración del escáner
        this.config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            cdnUrls: [
                'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
                'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
            ]
        };

        // Auto-inicializar la carga de la librería
        this.initLibraryLoader();
    }

    /**
     * Configurar callbacks externos
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Verificar compatibilidad del navegador
     */
    checkCompatibility() {
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
        const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        
        if (!isSecureContext) {
            throw new Error('HTTPS requerido para acceso a la cámara en móviles');
        }
        
        if (!hasMediaDevices) {
            throw new Error('Tu navegador no soporta acceso a la cámara');
        }
        
        return true;
    }

    /**
     * Inicializar el cargador de la librería HTML5-QRCode
     */
    initLibraryLoader() {
        console.log('📄 Iniciando carga de html5-qrcode...');
        
        window.qrLibraryLoadPromise = new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (typeof Html5Qrcode !== 'undefined') {
                console.log('✅ Html5Qrcode ya disponible');
                this.qrCodeLibrary = Html5Qrcode;
                resolve(Html5Qrcode);
                return;
            }

            let currentIndex = 0;
            
            const tryLoadFromCDN = (index) => {
                if (index >= this.config.cdnUrls.length) {
                    reject(new Error('No se pudo cargar html5-qrcode desde ningún CDN'));
                    return;
                }
                
                const script = document.createElement('script');
                script.src = this.config.cdnUrls[index];
                script.async = true;
                script.crossOrigin = 'anonymous';
                
                console.log(`⏳ Intentando cargar desde: ${this.config.cdnUrls[index]}`);
                
                script.onload = () => {
                    console.log(`✅ Script cargado desde: ${this.config.cdnUrls[index]}`);
                    
                    // Verificar disponibilidad con timeout
                    let attempts = 0;
                    const maxAttempts = 30;
                    
                    const checkAvailability = () => {
                        attempts++;
                        if (typeof Html5Qrcode !== 'undefined') {
                            console.log('✅ Html5Qrcode disponible después de', attempts, 'intentos');
                            this.qrCodeLibrary = Html5Qrcode;
                            resolve(Html5Qrcode);
                        } else if (attempts < maxAttempts) {
                            setTimeout(checkAvailability, 100);
                        } else {
                            console.warn(`⚠️ Html5Qrcode no disponible desde ${this.config.cdnUrls[index]}, probando siguiente...`);
                            document.head.removeChild(script);
                            tryLoadFromCDN(index + 1);
                        }
                    };
                    
                    checkAvailability();
                };
                
                script.onerror = (error) => {
                    console.warn(`⚠️ Error cargando desde ${this.config.cdnUrls[index]}:`, error);
                    document.head.removeChild(script);
                    tryLoadFromCDN(index + 1);
                };
                
                document.head.appendChild(script);
            };
            
            tryLoadFromCDN(0);
        });
        
        // También intentar cargar directamente sin Promise para casos edge
        window.addEventListener('load', () => {
            if (!this.qrCodeLibrary && typeof Html5Qrcode !== 'undefined') {
                this.qrCodeLibrary = Html5Qrcode;
                console.log('✅ Html5Qrcode disponible directamente después del load');
            }
        });
    }

    /**
     * Verificar estado de permisos sin solicitar acceso
     */
    async checkCameraPermissionStatus() {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                this.cameraPermissionStatus = permission.state;
                console.log('🔍 Estado de permisos de cámara:', permission.state);
                
                // Escuchar cambios en permisos
                permission.onchange = () => {
                    this.cameraPermissionStatus = permission.state;
                    console.log('🔄 Permisos de cámara cambiaron a:', permission.state);
                    
                    // Notificar cambio
                    if (this.callbacks.onPermissionChange) {
                        this.callbacks.onPermissionChange(permission.state);
                    }
                };
                
                return permission.state;
            } else {
                console.log('⚠️ API de permisos no disponible');
                return 'unknown';
            }
        } catch (error) {
            console.log('⚠️ Error verificando permisos:', error);
            return 'unknown';
        }
    }

    /**
     * Solicitar permisos de cámara
     */
    async requestCameraPermission() {
        try {
            console.log('📹 Solicitando permisos de cámara...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            // Cerrar stream inmediatamente después de verificar permisos
            stream.getTracks().forEach(track => track.stop());
            this.cameraPermissionStatus = 'granted';
            console.log('✅ Permisos de cámara otorgados');
            return true;
        } catch (error) {
            console.error('❌ Error de permisos de cámara:', error);
            this.cameraPermissionStatus = 'denied';
            throw error;
        }
    }

    /**
     * Asegurar que la librería QR está cargada
     */
    async ensureQrLibraryLoaded() {
        if (this.qrCodeLibrary) {
            console.log('✅ Librería ya disponible desde caché');
            return this.qrCodeLibrary;
        }
        
        try {
            console.log('⏳ Esperando carga de html5-qrcode...');
            const library = await window.qrLibraryLoadPromise;
            this.qrCodeLibrary = library;
            console.log('✅ Librería cargada y disponible');
            return library;
        } catch (error) {
            console.error('❌ Error cargando librería:', error);
            
            // Último intento: verificar si está disponible globalmente
            if (typeof Html5Qrcode !== 'undefined') {
                console.log('✅ Librería encontrada globalmente como fallback');
                this.qrCodeLibrary = Html5Qrcode;
                return Html5Qrcode;
            }
            
            throw new Error('La librería del escáner no se pudo cargar. Esto puede ser debido a bloqueo de contenido, adblocker o problemas de red.');
        }
    }

    /**
     * Generar mensaje de error amigable
     */
    getErrorMessage(error) {
        console.error('Detalle del error:', error);
        
        if (error.name === 'NotAllowedError') {
            return 'Permisos de cámara denegados. Permite el acceso en la configuración de tu navegador y recarga la página.';
        } else if (error.name === 'NotFoundError') {
            return 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotSupportedError') {
            return 'El navegador no soporta acceso a la cámara.';
        } else if (error.name === 'NotReadableError') {
            return 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            return 'Las restricciones de cámara no pueden ser satisfechas.';
        } else if (error.message && error.message.includes('HTTPS')) {
            return 'HTTPS requerido para acceso a la cámara en móviles.';
        } else if (error.message && (error.message.includes('librería') || error.message.includes('escáner') || error.message.includes('CDN'))) {
            return 'No se pudo cargar el escáner. Puede ser debido a un adblocker o restricciones de red. Desactiva tu adblocker y recarga la página.';
        }
        
        return 'Error inesperado: ' + (error.message || 'Error desconocido');
    }

    /**
     * Activar la cámara y preparar el escáner
     */
    async activateCamera() {
        try {
            // Actualizar estado
            this.updateStatus('Verificando compatibilidad...');
            
            // Verificar compatibilidad del navegador
            this.checkCompatibility();
            
            this.updateStatus('Solicitando permisos de cámara...');
            
            // Solicitar permisos de cámara
            await this.requestCameraPermission();
            
            this.updateStatus('Cargando escáner...');
            
            // Asegurar que la librería esté cargada
            await this.ensureQrLibraryLoaded();
            
            console.log('✅ Cámara activada correctamente');
            return true;
            
        } catch (error) {
            console.error('Error activando cámara:', error);
            const errorMessage = this.getErrorMessage(error);
            
            this.updateStatus(errorMessage);
            
            if (this.callbacks.onScanError) {
                this.callbacks.onScanError(error, errorMessage);
            }
            
            throw error;
        }
    }

    /**
     * Inicializar el escáner
     */
    async initializeScanner(elementId = 'qr-reader') {
        if (this.cameraPermissionStatus !== 'granted') {
            console.log('Permisos de cámara no otorgados');
            return false;
        }

        try {
            this.updateStatus('Iniciando cámara...');
            
            // Asegurar que tenemos la librería cargada
            const QrCodeLibrary = await this.ensureQrLibraryLoaded();
            
            console.log('Creando instancia de Html5Qrcode...');
            const html5QrCode = new QrCodeLibrary(elementId);
            this.activeCodeReader = html5QrCode;

            const config = { ...this.config };

            // Verificar si Html5QrcodeSupportedFormats está disponible
            if (typeof Html5QrcodeSupportedFormats !== 'undefined') {
                config.formatsToSupport = [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ];
            }

            this.updateStatus('Accediendo a la cámara...');
            console.log('Obteniendo dispositivos de cámara...');

            // Intentar obtener cámaras específicas
            try {
                const devices = await QrCodeLibrary.getCameras();
                console.log('Cámaras encontradas:', devices.length);
                
                if (devices && devices.length) {
                    // Preferir cámara trasera (la última en la lista generalmente es trasera)
                    const cameraId = devices[devices.length - 1].id;
                    console.log('Usando cámara:', cameraId);
                    
                    await html5QrCode.start(
                        cameraId,
                        config,
                        this.onScanSuccess.bind(this),
                        this.onScanFailure.bind(this)
                    );
                    
                    this.updateStatus('Buscando código de barras...');
                    this.isInitialized = true;
                    return true;
                } else {
                    throw new Error('No se encontraron cámaras');
                }
                
            } catch (cameraError) {
                console.log('Error con cámaras específicas, intentando con constrains genéricos...');
                
                // Fallback a constrains genéricos
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    this.onScanSuccess.bind(this),
                    this.onScanFailure.bind(this)
                );
                
                this.updateStatus('Buscando código de barras...');
                this.isInitialized = true;
                return true;
            }
            
        } catch (error) {
            console.error('Error inicializando escáner:', error);
            const errorMessage = this.getErrorMessage(error);
            
            this.updateStatus(errorMessage);
            
            if (this.callbacks.onScanError) {
                this.callbacks.onScanError(error, errorMessage);
            }
            
            // Limpiar el activeCodeReader si hay error
            this.activeCodeReader = null;
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Callback cuando se escanea un código exitosamente
     */
    onScanSuccess(decodedText, decodedResult) {
        console.log('✅ Código escaneado:', decodedText);
        this.stop();
        
        if (this.callbacks.onScanSuccess) {
            this.callbacks.onScanSuccess(decodedText, decodedResult);
        }
    }

    /**
     * Callback cuando falla el escaneo (normal durante el proceso)
     */
    onScanFailure(error) {
        // Error silencioso durante escaneo - normal que ocurra
    }

    /**
     * Detener el escáner
     */
    stop() {
        if (this.activeCodeReader) {
            try {
                console.log('Deteniendo escáner...');
                this.activeCodeReader.stop().then(() => {
                    console.log('✅ Escáner detenido correctamente');
                    this.activeCodeReader.clear();
                }).catch(err => {
                    console.error('Error deteniendo el escáner:', err);
                }).finally(() => {
                    this.activeCodeReader = null;
                    this.isInitialized = false;
                });
            } catch (error) {
                console.error('Error deteniendo el escáner:', error);
                this.activeCodeReader = null;
                this.isInitialized = false;
            }
        }
    }

    /**
     * Actualizar estado y notificar
     */
    updateStatus(message) {
        console.log('📊 Estado del escáner:', message);
        
        if (this.callbacks.onStatusUpdate) {
            this.callbacks.onStatusUpdate(message);
        }
    }

    /**
     * Obtener estado actual del escáner
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            cameraPermissionStatus: this.cameraPermissionStatus,
            hasActiveReader: !!this.activeCodeReader,
            libraryLoaded: !!this.qrCodeLibrary
        };
    }

    /**
     * Limpiar recursos al destruir el módulo
     */
    destroy() {
        this.stop();
        this.callbacks = {};
        this.qrCodeLibrary = null;
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScannerModule;
} else if (typeof window !== 'undefined') {
    window.ScannerModule = ScannerModule;
}