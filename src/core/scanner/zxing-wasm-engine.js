/**
 * ZXing WASM Engine - Motor de escaneo usando @zxing/browser (WebAssembly)
 * Versión: 2.1.0 - Alto rendimiento con ZXing compilado a WebAssembly + CDNs optimizados
 */

class ZXingWASMEngine extends IScannerEngine {
    constructor() {
        super();
        this.codeReader = null;
        this.videoElement = null;
        this.stream = null;
        this.isScanning = false;
        this.isLibraryLoaded = false;
        this.loadingPromise = null;
        
        this.scanCallbacks = {
            onSuccess: null,
            onError: null
        };

        // Configuración específica para ZXing WASM con CDNs optimizados
        this.config = {
            // CDNs optimizados por velocidad y confiabilidad (ordenados por prioridad)
            cdnUrls: [
                // Tier 1: CDNs más rápidos y confiables
                'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js',
                'https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js',
                
                // Tier 2: Versiones alternativas
                'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.4/umd/zxing-browser.min.js',
                'https://unpkg.com/@zxing/browser@0.1.4/umd/zxing-browser.min.js',
                
                // Tier 3: CDNs alternativos
                'https://cdnjs.cloudflare.com/ajax/libs/zxing-browser/0.1.4/zxing-browser.min.js',
                
                // Tier 4: Fallback final con versión estable antigua
                'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.3/umd/zxing-browser.min.js'
            ],
            
            // Configuración de carga optimizada
            loadingConfig: {
                timeout: 15000, // 15 segundos timeout por CDN
                maxRetries: 6, // Máximo 6 CDNs
                retryDelay: 500, // 500ms entre intentos
                parallelLoad: false, // Carga secuencial para evitar saturar la red
                preloadEnabled: true, // Habilitar precarga si es posible
                cacheStrategy: 'aggressive' // Estrategia de caché agresiva
            },
            
            // Formatos de código que queremos detectar
            formats: [
                'CODE_128',    // Más comunes en productos
                'CODE_39',
                'EAN_13',
                'EAN_8',
                'UPC_A',
                'UPC_E',
                'QR_CODE',     // QR codes también
                'DATA_MATRIX'  // Códigos 2D adicionales
            ],
            
            // Configuración de escaneo
            scanOptions: {
                tryHarder: true,           // Modo de mayor precisión
                returnCodabarStartEnd: false,
                formats: null              // Se configurará dinámicamente
            },
            
            // Configuración de cámara
            cameraOptions: {
                facingMode: 'environment',
                frameRate: { ideal: 30, min: 15 },
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
            }
        };

        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            libraryLoadTime: 0,
            wasmLoadTime: 0,
            cdnAttempts: [],
            successfulCdn: null,
            loadingRetries: 0
        };

        // Detección de conexión para optimizar carga
        this.connectionInfo = this._getConnectionInfo();
    }

    /**
     * Obtener información de conexión para optimizar carga
     * @private
     */
    _getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
            };
        }
        
        return {
            effectiveType: 'unknown',
            downlink: null,
            rtt: null,
            saveData: false,
            isSlowConnection: false
        };
    }

    /**
     * Verificar si ZXing WASM está disponible
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            // Verificar soporte de WebAssembly
            if (typeof WebAssembly !== 'object') {
                console.log('❌ WebAssembly no soportado en este navegador');
                return false;
            }

            // Verificar contexto seguro (requerido para getUserMedia)
            if (!window.isSecureContext && !this._isLocalhost()) {
                console.log('❌ Contexto seguro requerido para ZXing WASM');
                return false;
            }

            // Verificar getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('❌ getUserMedia no disponible');
                return false;
            }

            // Verificar si la conexión es muy lenta
            if (this.connectionInfo.isSlowConnection && this.connectionInfo.saveData) {
                console.log('⚠️ Conexión lenta detectada, ZXing WASM puede no ser óptimo');
                // Aún disponible pero con advertencia
            }

            console.log('✅ ZXing WASM engine disponible');
            console.log('📶 Conexión:', this.connectionInfo.effectiveType || 'desconocida');
            return true;
        } catch (error) {
            console.log('❌ Error verificando ZXing WASM:', error);
            return false;
        }
    }

    /**
     * Inicializar el motor de escaneo
     * @param {string} elementId - ID del elemento DOM para el video
     * @param {Object} config - Configuración del escáner
     * @returns {Promise<boolean>}
     */
    async initialize(elementId, config = {}) {
        try {
            console.log('🚀 Inicializando ZXing WASM engine con CDNs optimizados...');

            // Verificar disponibilidad
            if (!(await this.isAvailable())) {
                throw new Error('ZXing WASM no está disponible');
            }

            // Cargar librería si no está cargada
            if (!this.isLibraryLoaded) {
                await this._loadZXingLibrary();
            }

            // Configurar elemento de video
            this.videoElement = document.getElementById(elementId);
            if (!this.videoElement) {
                throw new Error(`Elemento con ID '${elementId}' no encontrado`);
            }

            // Aplicar estilos al video
            this._setupVideoElement();

            // Crear instancia del CodeReader
            await this._createCodeReader();

            console.log('✅ ZXing WASM engine inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando ZXing WASM engine:', error);
            throw error;
        }
    }

    /**
     * Cargar la librería ZXing desde CDN con estrategia optimizada
     * @private
     */
    async _loadZXingLibrary() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise(async (resolve, reject) => {
            const startTime = performance.now();
            
            try {
                // Verificar si ya está cargada globalmente
                if (typeof ZXing !== 'undefined' && ZXing.BrowserMultiFormatReader) {
                    console.log('✅ ZXing ya disponible globalmente');
                    this.isLibraryLoaded = true;
                    this.stats.libraryLoadTime = performance.now() - startTime;
                    this.stats.successfulCdn = 'pre-loaded';
                    resolve();
                    return;
                }

                console.log('📦 Cargando ZXing WASM desde CDNs optimizados...');
                console.log(`📶 Conexión detectada: ${this.connectionInfo.effectiveType} (${this.connectionInfo.downlink}Mbps)`);
                
                // Optimizar lista de CDNs basada en conexión
                const optimizedCdns = this._optimizeCdnList();
                
                let loadedSuccessfully = false;
                this.stats.cdnAttempts = [];

                // Intentar cargar desde cada CDN optimizado
                for (const [index, cdnUrl] of optimizedCdns.entries()) {
                    const attemptStart = performance.now();
                    
                    try {
                        console.log(`⏳ Intento ${index + 1}/${optimizedCdns.length}: ${this._getCdnName(cdnUrl)}`);
                        
                        await this._loadScriptFromCDN(cdnUrl, this.config.loadingConfig.timeout);
                        
                        const attemptTime = performance.now() - attemptStart;
                        
                        // Verificar disponibilidad después de cargar
                        if (typeof ZXing !== 'undefined' && ZXing.BrowserMultiFormatReader) {
                            console.log(`✅ ZXing cargado exitosamente desde ${this._getCdnName(cdnUrl)} en ${attemptTime.toFixed(1)}ms`);
                            
                            this.stats.cdnAttempts.push({
                                url: cdnUrl,
                                name: this._getCdnName(cdnUrl),
                                success: true,
                                loadTime: attemptTime,
                                index
                            });
                            
                            this.stats.successfulCdn = this._getCdnName(cdnUrl);
                            loadedSuccessfully = true;
                            break;
                        } else {
                            throw new Error('ZXing no disponible después de cargar');
                        }
                    } catch (error) {
                        const attemptTime = performance.now() - attemptStart;
                        console.warn(`⚠️ Error cargando desde ${this._getCdnName(cdnUrl)} (${attemptTime.toFixed(1)}ms):`, error.message);
                        
                        this.stats.cdnAttempts.push({
                            url: cdnUrl,
                            name: this._getCdnName(cdnUrl),
                            success: false,
                            loadTime: attemptTime,
                            error: error.message,
                            index
                        });
                        
                        // Delay breve entre intentos si no es el último
                        if (index < optimizedCdns.length - 1) {
                            await this._delay(this.config.loadingConfig.retryDelay);
                        }
                        continue;
                    }
                }

                if (!loadedSuccessfully) {
                    const errorMsg = `No se pudo cargar ZXing WASM desde ningún CDN (${this.stats.cdnAttempts.length} intentos)`;
                    console.error('❌', errorMsg);
                    console.table(this.stats.cdnAttempts);
                    throw new Error(errorMsg);
                }

                this.isLibraryLoaded = true;
                this.stats.libraryLoadTime = performance.now() - startTime;
                this.stats.loadingRetries = this.stats.cdnAttempts.filter(a => !a.success).length;
                
                console.log(`✅ ZXing WASM cargado completamente en ${this.stats.libraryLoadTime.toFixed(1)}ms`);
                console.log(`📊 Estadísticas de carga:`, {
                    cdnExitoso: this.stats.successfulCdn,
                    intentosFallidos: this.stats.loadingRetries,
                    tiempoTotal: this.stats.libraryLoadTime.toFixed(1) + 'ms'
                });
                
                resolve();
                
            } catch (error) {
                console.error('❌ Error cargando ZXing WASM:', error);
                reject(error);
            }
        });

        return this.loadingPromise;
    }

    /**
     * Optimizar lista de CDNs basada en conexión y ubicación
     * @private
     */
    _optimizeCdnList() {
        let cdns = [...this.config.cdnUrls];
        
        // Si la conexión es lenta, priorizar CDNs más confiables y usar versiones más pequeñas
        if (this.connectionInfo.isSlowConnection || this.connectionInfo.saveData) {
            console.log('🐌 Conexión lenta detectada, optimizando CDNs...');
            
            // Priorizar jsdelivr y unpkg (más rápidos)
            cdns = cdns.filter(url => url.includes('jsdelivr') || url.includes('unpkg')).concat(
                cdns.filter(url => !url.includes('jsdelivr') && !url.includes('unpkg'))
            );
            
            // Limitar a solo los 4 mejores CDNs para conexiones lentas
            cdns = cdns.slice(0, 4);
        }

        // Detectar región aproximada y optimizar CDNs
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Europe')) {
            // Priorizar CDNs europeos
            cdns = this._prioritizeCdnsByRegion(cdns, ['jsdelivr', 'unpkg']);
        } else if (timezone.includes('America')) {
            // Priorizar CDNs americanos
            cdns = this._prioritizeCdnsByRegion(cdns, ['unpkg', 'jsdelivr']);
        }

        console.log(`📡 CDNs optimizados para carga (${cdns.length} candidatos):`, 
                   cdns.map(url => this._getCdnName(url)));
        
        return cdns;
    }

    /**
     * Priorizar CDNs por región
     * @private
     */
    _prioritizeCdnsByRegion(cdns, preferredProviders) {
        const prioritized = [];
        const others = [];
        
        for (const cdn of cdns) {
            if (preferredProviders.some(provider => cdn.includes(provider))) {
                prioritized.push(cdn);
            } else {
                others.push(cdn);
            }
        }
        
        return [...prioritized, ...others];
    }

    /**
     * Obtener nombre amigable del CDN
     * @private
     */
    _getCdnName(url) {
        if (url.includes('jsdelivr.net')) return 'jsDelivr';
        if (url.includes('unpkg.com')) return 'UNPKG';
        if (url.includes('cdnjs.cloudflare.com')) return 'Cloudflare';
        return 'CDN Desconocido';
    }

    /**
     * Cargar script desde CDN específico con timeout optimizado
     * @private
     */
    _loadScriptFromCDN(url, timeout = 10000) {
        return new Promise((resolve, reject) => {
            // Verificar si ya existe un script con esta URL
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                // Si ya existe, esperar a que se cargue
                if (typeof ZXing !== 'undefined') {
                    resolve();
                } else {
                    // Esperar un poco más
                    setTimeout(() => {
                        if (typeof ZXing !== 'undefined') {
                            resolve();
                        } else {
                            reject(new Error('Script ya existe pero ZXing no disponible'));
                        }
                    }, 1000);
                }
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            // Configurar atributos de optimización
            script.setAttribute('importance', 'high');
            script.setAttribute('fetchpriority', 'high');
            
            let timeoutId;
            
            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
            
            script.onload = () => {
                console.log(`📦 Script ZXing cargado: ${this._getCdnName(url)}`);
                cleanup();
                // Dar tiempo para que ZXing se inicialice
                setTimeout(resolve, 200);
            };
            
            script.onerror = (error) => {
                console.warn(`❌ Error cargando script ZXing: ${this._getCdnName(url)}`);
                cleanup();
                reject(new Error(`Failed to load script from ${url}`));
            };
            
            // Timeout personalizado
            timeoutId = setTimeout(() => {
                console.warn(`⏱️ Timeout cargando script ZXing: ${this._getCdnName(url)}`);
                cleanup();
                reject(new Error(`Timeout loading script from ${url}`));
            }, timeout);
            
            document.head.appendChild(script);
        });
    }

    /**
     * Configurar elemento de video
     * @private
     */
    _setupVideoElement() {
        this.videoElement.style.width = '100%';
        this.videoElement.style.height = '100%';
        this.videoElement.style.objectFit = 'cover';
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        this.videoElement.autoplay = true;
    }

    /**
     * Crear instancia del CodeReader
     * @private
     */
    async _createCodeReader() {
        try {
            const wasmLoadStart = performance.now();
            
            if (!ZXing || !ZXing.BrowserMultiFormatReader) {
                throw new Error('ZXing.BrowserMultiFormatReader no disponible');
            }

            // Crear instancia con formatos específicos
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            
            // Configurar formatos si está disponible
            if (this.codeReader.hints && ZXing.BarcodeFormat) {
                const hints = new Map();
                const formats = this.config.formats
                    .filter(format => ZXing.BarcodeFormat[format] !== undefined)
                    .map(format => ZXing.BarcodeFormat[format]);
                
                if (formats.length > 0) {
                    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
                    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
                    this.codeReader.hints = hints;
                    console.log('🎯 Formatos ZXing configurados:', this.config.formats.filter(f => ZXing.BarcodeFormat[f]));
                }
            }
            
            this.stats.wasmLoadTime = performance.now() - wasmLoadStart;
            console.log(`⚡ CodeReader ZXing creado en ${this.stats.wasmLoadTime.toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ Error creando CodeReader ZXing:', error);
            throw error;
        }
    }

    /**
     * Iniciar el escaneo
     * @param {Function} onSuccess - Callback para códigos detectados
     * @param {Function} onError - Callback para errores
     * @returns {Promise<boolean>}
     */
    async start(onSuccess, onError) {
        try {
            if (this.isScanning) {
                console.log('⚠️ El escaneo ZXing ya está en progreso');
                return true;
            }

            console.log('▶️ Iniciando escaneo con ZXing WASM...');

            // Guardar callbacks
            this.scanCallbacks.onSuccess = onSuccess;
            this.scanCallbacks.onError = onError;

            // Asegurar que el CodeReader esté disponible
            if (!this.codeReader) {
                await this._createCodeReader();
            }

            // Iniciar escaneo desde cámara
            this.isScanning = true;
            
            await this.codeReader.decodeFromVideoDevice(
                null, // deviceId (null = default/environment camera)
                this.videoElement,
                (result, error) => {
                    if (result) {
                        this._handleScanSuccess(result);
                    }
                    if (error && error.name !== 'NotFoundException') {
                        this._handleScanError(error);
                    }
                }
            );

            console.log('✅ Escaneo ZXing WASM iniciado correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error iniciando escaneo ZXing:', error);
            this.isScanning = false;
            
            if (this.scanCallbacks.onError) {
                this.scanCallbacks.onError(error, this._getErrorMessage(error));
            }
            
            throw error;
        }
    }

    /**
     * Manejar éxito en escaneo
     * @private
     */
    _handleScanSuccess(result) {
        if (!this.isScanning) return;

        const scanTime = performance.now();
        this._updateStats(scanTime - this.stats.lastScanTime, true);
        
        console.log('🎯 Código detectado con ZXing WASM:', result);
        
        // Detener escaneo
        this.isScanning = false;
        
        if (this.scanCallbacks.onSuccess) {
            this.scanCallbacks.onSuccess(
                result.text,
                {
                    format: result.barcodeFormat ? result.barcodeFormat.toString() : 'UNKNOWN',
                    resultPoints: result.resultPoints,
                    engine: 'wasm',
                    scanTime: scanTime - this.stats.lastScanTime,
                    confidence: 0.9, // ZXing WASM tiene alta confianza
                    rawResult: result,
                    cdnUsed: this.stats.successfulCdn // Información adicional del CDN usado
                }
            );
        }
    }

    /**
     * Manejar error en escaneo
     * @private
     */
    _handleScanError(error) {
        // NotFoundException es normal durante escaneo, ignorar
        if (error.name === 'NotFoundException') {
            return;
        }

        console.warn('⚠️ Error en escaneo ZXing:', error);
        
        if (this.scanCallbacks.onError) {
            this.scanCallbacks.onError(error, this._getErrorMessage(error));
        }
    }

    /**
     * Actualizar estadísticas
     * @private
     */
    _updateStats(scanTime, success) {
        this.stats.scansPerformed++;
        this.stats.lastScanTime = performance.now();
        
        if (success) {
            this.stats.successfulScans++;
        }
        
        if (scanTime > 0) {
            this.stats.averageTime = (this.stats.averageTime * 0.9) + (scanTime * 0.1);
        }
    }

    /**
     * Detener el escaneo
     * @returns {Promise<void>}
     */
    async stop() {
        try {
            console.log('⏹️ Deteniendo escaneo ZXing WASM...');
            
            this.isScanning = false;

            if (this.codeReader) {
                try {
                    await this.codeReader.reset();
                    console.log('🔄 CodeReader ZXing reseteado');
                } catch (resetError) {
                    console.warn('⚠️ Error reseteando CodeReader ZXing:', resetError);
                }
            }

            // Limpiar elemento de video
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }

            console.log('✅ Escaneo ZXing WASM detenido');
            console.log('📊 Estadísticas finales ZXing:', this.stats);
        } catch (error) {
            console.error('⚠️ Error deteniendo escaneo ZXing:', error);
        }
    }

    /**
     * Limpiar recursos
     * @returns {Promise<void>}
     */
    async destroy() {
        await this.stop();
        
        this.codeReader = null;
        this.videoElement = null;
        this.scanCallbacks = { onSuccess: null, onError: null };
        
        // Resetear estadísticas
        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            libraryLoadTime: 0,
            wasmLoadTime: 0,
            cdnAttempts: [],
            successfulCdn: null,
            loadingRetries: 0
        };
        
        console.log('🧹 ZXing WASM engine destruido');
    }

    /**
     * Obtener información del motor
     * @returns {Object}
     */
    getInfo() {
        return {
            name: 'ZXing (WebAssembly)',
            type: 'wasm',
            performance: 'high',
            formats: this.config.formats,
            stats: { ...this.stats },
            isActive: this.isScanning,
            isLibraryLoaded: this.isLibraryLoaded,
            cdnInfo: {
                successfulCdn: this.stats.successfulCdn,
                loadingAttempts: this.stats.cdnAttempts.length,
                loadingRetries: this.stats.loadingRetries,
                totalLoadTime: this.stats.libraryLoadTime
            },
            connectionInfo: this.connectionInfo,
            capabilities: {
                realTime: true,
                highAccuracy: true,
                lowLatency: false,
                hardwareAccelerated: false,
                crossPlatform: true,
                optimizedLoading: true // Nueva característica
            }
        };
    }

    /**
     * Obtener mensaje de error amigable
     * @private
     */
    _getErrorMessage(error) {
        if (error.name === 'NotAllowedError') {
            return 'Permisos de cámara denegados para ZXing WASM. Permite el acceso y recarga.';
        } else if (error.name === 'NotFoundError') {
            return 'No se encontró cámara para ZXing WASM.';
        } else if (error.name === 'NotReadableError') {
            return 'La cámara está siendo usada por otra aplicación.';
        } else if (error.message && error.message.includes('WASM')) {
            return 'Error cargando WebAssembly. Verifica tu conexión e intenta recargar.';
        } else if (error.message && error.message.includes('CDN')) {
            return `Error cargando ZXing WASM desde CDNs. ${this.connectionInfo.isSlowConnection ? 'Conexión lenta detectada.' : 'Verifica tu conexión.'} Intenta recargar.`;
        }
        
        return `Error del motor WASM: ${error.message}`;
    }

    /**
     * Verificar si es localhost
     * @private
     */
    _isLocalhost() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.hostname === '::1';
    }

    /**
     * Delay helper
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener estadísticas de rendimiento mejoradas
     * @returns {Object}
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            fps: this.stats.averageTime > 0 ? Math.round(1000 / this.stats.averageTime) : 0,
            successRate: this.stats.scansPerformed > 0 ? 
                (this.stats.successfulScans / this.stats.scansPerformed) * 100 : 0,
            loadingTimes: {
                library: this.stats.libraryLoadTime,
                wasm: this.stats.wasmLoadTime,
                total: this.stats.libraryLoadTime + this.stats.wasmLoadTime
            },
            cdnPerformance: {
                successfulCdn: this.stats.successfulCdn,
                totalAttempts: this.stats.cdnAttempts.length,
                failedAttempts: this.stats.loadingRetries,
                averageAttemptTime: this.stats.cdnAttempts.length > 0 ?
                    this.stats.cdnAttempts.reduce((sum, attempt) => sum + attempt.loadTime, 0) / this.stats.cdnAttempts.length : 0,
                cdnReliability: this.stats.cdnAttempts.length > 0 ?
                    ((this.stats.cdnAttempts.length - this.stats.loadingRetries) / this.stats.cdnAttempts.length) * 100 : 0
            },
            connectionOptimization: {
                connectionType: this.connectionInfo.effectiveType,
                isOptimizedForConnection: this.connectionInfo.isSlowConnection ? 
                    this.stats.cdnAttempts.length <= 4 : true,
                downlink: this.connectionInfo.downlink,
                rtt: this.connectionInfo.rtt
            }
        };
    }

    /**
     * Obtener reporte de CDNs para analytics
     * @returns {Object}
     */
    getCdnReport() {
        return {
            attempts: this.stats.cdnAttempts,
            successfulCdn: this.stats.successfulCdn,
            totalLoadTime: this.stats.libraryLoadTime,
            retryCount: this.stats.loadingRetries,
            connectionInfo: this.connectionInfo,
            optimization: {
                cdnsOptimized: true,
                regionOptimized: true,
                connectionOptimized: this.connectionInfo.isSlowConnection
            }
        };
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZXingWASMEngine;
} else if (typeof window !== 'undefined') {
    window.ZXingWASMEngine = ZXingWASMEngine;
}