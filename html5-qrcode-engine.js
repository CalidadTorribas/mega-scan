/**
 * HTML5-QRCode Engine - Motor de escaneo usando html5-qrcode (JavaScript puro)
 * Versión: 2.1.0 - Motor de compatibilidad y fallback final + CDNs optimizados
 * 
 * Este motor actúa como wrapper de la implementación actual de html5-qrcode,
 * manteniendo toda la funcionalidad existente como fallback confiable.
 */

class HTML5QRCodeEngine extends IScannerEngine {
    constructor() {
        super();
        this.html5QrCode = null;
        this.videoElement = null;
        this.isScanning = false;
        this.isLibraryLoaded = false;
        this.loadingPromise = null;
        
        this.scanCallbacks = {
            onSuccess: null,
            onError: null
        };

        // Configuración heredada del scanner-module.js actual con CDNs optimizados
        this.config = {
            // CDNs optimizados por velocidad y confiabilidad (ordenados por prioridad)
            cdnUrls: [
                // Tier 1: CDNs más rápidos y confiables (versiones más recientes)
                'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
                'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
                
                // Tier 2: Versiones alternativas estables
                'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.7/minified/html5-qrcode.min.js',
                'https://unpkg.com/html5-qrcode@2.3.7/minified/html5-qrcode.min.js',
                
                // Tier 3: CDNs alternativos
                'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.7/html5-qrcode.min.js',
                
                // Tier 4: Versiones más antiguas pero estables
                'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.4/minified/html5-qrcode.min.js',
                'https://unpkg.com/html5-qrcode@2.3.4/minified/html5-qrcode.min.js'
            ],
            
            // Configuración de carga optimizada
            loadingConfig: {
                timeout: 20000, // 20 segundos timeout por CDN (más tiempo que WASM)
                maxRetries: 8, // Máximo 8 CDNs
                retryDelay: 800, // 800ms entre intentos
                parallelLoad: false, // Carga secuencial
                preloadEnabled: true,
                cacheStrategy: 'aggressive',
                waitForAvailability: 30, // Intentos para verificar disponibilidad
                availabilityDelay: 100 // ms entre verificaciones
            },
            
            // Configuración optimizada para html5-qrcode
            scannerConfig: {
                fps: 10,
                qrbox: { width: 320, height: 200 },
                aspectRatio: 1.6,
                formatsToSupport: null // Se configurará dinámicamente
            },
            
            // Configuración de cámara
            cameraConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            libraryLoadTime: 0,
            initializationTime: 0,
            cdnAttempts: [],
            successfulCdn: null,
            loadingRetries: 0,
            availabilityChecks: 0
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
                isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
                isVerySlowConnection: connection.effectiveType === 'slow-2g'
            };
        }
        
        return {
            effectiveType: 'unknown',
            downlink: null,
            rtt: null,
            saveData: false,
            isSlowConnection: false,
            isVerySlowConnection: false
        };
    }

    /**
     * Verificar si html5-qrcode está disponible
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            // html5-qrcode funciona en prácticamente cualquier navegador moderno
            
            // Verificar contexto seguro básico
            if (!window.isSecureContext && !this._isLocalhost()) {
                console.log('⚠️ Contexto seguro recomendado para html5-qrcode');
                // No bloqueamos, ya que puede funcionar en algunos casos
            }

            // Verificar getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('❌ getUserMedia no disponible para html5-qrcode');
                return false;
            }

            console.log('✅ html5-qrcode engine disponible (fallback universal)');
            console.log('📶 Conexión:', this.connectionInfo.effectiveType || 'desconocida');
            return true;
        } catch (error) {
            console.log('❌ Error verificando html5-qrcode:', error);
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
            console.log('🚀 Inicializando html5-qrcode engine (fallback) con CDNs optimizados...');
            const initStart = performance.now();

            // Verificar disponibilidad
            if (!(await this.isAvailable())) {
                throw new Error('html5-qrcode no está disponible');
            }

            // Cargar librería si no está cargada
            if (!this.isLibraryLoaded) {
                await this._loadHTML5QRCodeLibrary();
            }

            // Verificar elemento de destino
            const targetElement = document.getElementById(elementId);
            if (!targetElement) {
                throw new Error(`Elemento con ID '${elementId}' no encontrado`);
            }

            // Crear instancia de html5-qrcode
            await this._createQRCodeInstance(elementId);

            // Configurar formatos soportados si están disponibles
            this._configureFormats();

            this.stats.initializationTime = performance.now() - initStart;
            console.log(`✅ html5-qrcode engine inicializado en ${this.stats.initializationTime.toFixed(1)}ms`);
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando html5-qrcode engine:', error);
            throw error;
        }
    }

    /**
     * Cargar la librería html5-qrcode desde CDN con estrategia optimizada
     * @private
     */
    async _loadHTML5QRCodeLibrary() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise(async (resolve, reject) => {
            const startTime = performance.now();
            
            try {
                // Verificar si ya está cargada globalmente
                if (typeof Html5Qrcode !== 'undefined') {
                    console.log('✅ html5-qrcode ya disponible globalmente');
                    this.isLibraryLoaded = true;
                    this.stats.libraryLoadTime = performance.now() - startTime;
                    this.stats.successfulCdn = 'pre-loaded';
                    resolve();
                    return;
                }

                console.log('📦 Cargando html5-qrcode desde CDNs optimizados...');
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
                        
                        // Verificar disponibilidad después de cargar con reintentos
                        const isAvailable = await this._waitForHTML5QRCode();
                        
                        if (isAvailable && typeof Html5Qrcode !== 'undefined') {
                            console.log(`✅ html5-qrcode cargado exitosamente desde ${this._getCdnName(cdnUrl)} en ${attemptTime.toFixed(1)}ms`);
                            
                            this.stats.cdnAttempts.push({
                                url: cdnUrl,
                                name: this._getCdnName(cdnUrl),
                                success: true,
                                loadTime: attemptTime,
                                availabilityChecks: this.stats.availabilityChecks,
                                index
                            });
                            
                            this.stats.successfulCdn = this._getCdnName(cdnUrl);
                            loadedSuccessfully = true;
                            break;
                        } else {
                            throw new Error('Html5Qrcode no disponible después de esperar');
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
                            availabilityChecks: this.stats.availabilityChecks,
                            index
                        });
                        
                        // Reset availability checks for next attempt
                        this.stats.availabilityChecks = 0;
                        
                        // Delay breve entre intentos si no es el último
                        if (index < optimizedCdns.length - 1) {
                            await this._delay(this.config.loadingConfig.retryDelay);
                        }
                        continue;
                    }
                }

                if (!loadedSuccessfully) {
                    const errorMsg = `No se pudo cargar html5-qrcode desde ningún CDN (${this.stats.cdnAttempts.length} intentos)`;
                    console.error('❌', errorMsg);
                    console.table(this.stats.cdnAttempts);
                    throw new Error(errorMsg);
                }

                this.isLibraryLoaded = true;
                this.stats.libraryLoadTime = performance.now() - startTime;
                this.stats.loadingRetries = this.stats.cdnAttempts.filter(a => !a.success).length;
                
                console.log(`✅ html5-qrcode cargado completamente en ${this.stats.libraryLoadTime.toFixed(1)}ms`);
                console.log(`📊 Estadísticas de carga:`, {
                    cdnExitoso: this.stats.successfulCdn,
                    intentosFallidos: this.stats.loadingRetries,
                    verificacionesDisponibilidad: this.stats.cdnAttempts.reduce((sum, a) => sum + (a.availabilityChecks || 0), 0),
                    tiempoTotal: this.stats.libraryLoadTime.toFixed(1) + 'ms'
                });
                
                resolve();
                
            } catch (error) {
                console.error('❌ Error cargando html5-qrcode:', error);
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
        
        // Si la conexión es muy lenta, priorizar solo las versiones más pequeñas y confiables
        if (this.connectionInfo.isVerySlowConnection || this.connectionInfo.saveData) {
            console.log('🐌 Conexión muy lenta detectada, usando solo CDNs prioritarios...');
            
            // Usar solo jsdelivr y unpkg con versiones más recientes (más optimizadas)
            cdns = cdns.filter(url => 
                (url.includes('jsdelivr') || url.includes('unpkg')) && 
                (url.includes('2.3.8') || url.includes('2.3.7'))
            ).slice(0, 4);
            
        } else if (this.connectionInfo.isSlowConnection) {
            console.log('🐌 Conexión lenta detectada, optimizando CDNs...');
            
            // Priorizar jsdelivr y unpkg, luego otros
            cdns = cdns.filter(url => url.includes('jsdelivr') || url.includes('unpkg')).concat(
                cdns.filter(url => !url.includes('jsdelivr') && !url.includes('unpkg'))
            );
            
            // Limitar a 6 CDNs para conexiones lentas
            cdns = cdns.slice(0, 6);
        }

        // Detectar región aproximada y optimizar CDNs
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Europe')) {
            // Priorizar CDNs europeos (jsDelivr tiene buenos servers en EU)
            cdns = this._prioritizeCdnsByRegion(cdns, ['jsdelivr', 'cdnjs', 'unpkg']);
        } else if (timezone.includes('America')) {
            // Priorizar CDNs americanos (unpkg es bueno en US)
            cdns = this._prioritizeCdnsByRegion(cdns, ['unpkg', 'jsdelivr', 'cdnjs']);
        } else if (timezone.includes('Asia')) {
            // Para Asia, jsDelivr suele ser el mejor
            cdns = this._prioritizeCdnsByRegion(cdns, ['jsdelivr', 'unpkg', 'cdnjs']);
        }

        console.log(`📡 CDNs html5-qrcode optimizados (${cdns.length} candidatos):`, 
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
    _loadScriptFromCDN(url, timeout = 15000) {
        return new Promise((resolve, reject) => {
            // Verificar si ya existe un script con esta URL
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                // Si ya existe, verificar disponibilidad
                if (typeof Html5Qrcode !== 'undefined') {
                    resolve();
                } else {
                    // Esperar un poco más
                    setTimeout(() => {
                        if (typeof Html5Qrcode !== 'undefined') {
                            resolve();
                        } else {
                            reject(new Error('Script ya existe pero Html5Qrcode no disponible'));
                        }
                    }, 1000);
                }
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            // Configurar atributos de optimización para html5-qrcode (archivo más grande)
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
                console.log(`📦 Script html5-qrcode cargado: ${this._getCdnName(url)}`);
                cleanup();
                // html5-qrcode necesita más tiempo para inicializarse
                setTimeout(resolve, 300);
            };
            
            script.onerror = (error) => {
                console.warn(`❌ Error cargando script html5-qrcode: ${this._getCdnName(url)}`);
                cleanup();
                reject(new Error(`Failed to load script from ${url}`));
            };
            
            // Timeout personalizado (más tiempo para html5-qrcode)
            timeoutId = setTimeout(() => {
                console.warn(`⏱️ Timeout cargando script html5-qrcode: ${this._getCdnName(url)} (${timeout}ms)`);
                cleanup();
                reject(new Error(`Timeout loading script from ${url}`));
            }, timeout);
            
            document.head.appendChild(script);
        });
    }

    /**
     * Esperar a que Html5Qrcode esté disponible (heredado del ScannerModule con mejoras)
     * @private
     */
    _waitForHTML5QRCode() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = this.config.loadingConfig.waitForAvailability;
            
            const checkAvailability = () => {
                attempts++;
                this.stats.availabilityChecks = attempts;
                
                if (typeof Html5Qrcode !== 'undefined') {
                    console.log(`✅ Html5Qrcode disponible después de ${attempts} verificaciones`);
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    setTimeout(checkAvailability, this.config.loadingConfig.availabilityDelay);
                } else {
                    console.warn(`⏱️ Html5Qrcode no disponible después de ${attempts} verificaciones`);
                    resolve(false);
                }
            };
            
            checkAvailability();
        });
    }

    /**
     * Crear instancia de Html5Qrcode
     * @private
     */
    async _createQRCodeInstance(elementId) {
        try {
            if (!Html5Qrcode) {
                throw new Error('Html5Qrcode no está disponible');
            }

            this.html5QrCode = new Html5Qrcode(elementId);
            console.log('🔧 Instancia Html5Qrcode creada correctamente');
            
        } catch (error) {
            console.error('❌ Error creando instancia Html5Qrcode:', error);
            throw error;
        }
    }

    /**
     * Configurar formatos soportados
     * @private
     */
    _configureFormats() {
        try {
            // Verificar si Html5QrcodeSupportedFormats está disponible
            if (typeof Html5QrcodeSupportedFormats !== 'undefined') {
                this.config.scannerConfig.formatsToSupport = [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ];
                console.log('🎯 Formatos html5-qrcode configurados:', this.config.scannerConfig.formatsToSupport.length);
            } else {
                console.log('⚠️ Html5QrcodeSupportedFormats no disponible, usando configuración por defecto');
            }
        } catch (error) {
            console.warn('⚠️ Error configurando formatos html5-qrcode:', error);
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
                console.log('⚠️ El escaneo html5-qrcode ya está en progreso');
                return true;
            }

            console.log('▶️ Iniciando escaneo con html5-qrcode...');

            // Guardar callbacks
            this.scanCallbacks.onSuccess = onSuccess;
            this.scanCallbacks.onError = onError;

            // Asegurar que la instancia esté disponible
            if (!this.html5QrCode) {
                throw new Error('Instancia Html5Qrcode no disponible');
            }

            // Preparar configuración (misma lógica que ScannerModule actual)
            const config = { ...this.config.scannerConfig };

            // Intentar iniciar con cámaras específicas primero
            try {
                const cameras = await Html5Qrcode.getCameras();
                console.log('📹 Cámaras html5-qrcode encontradas:', cameras.length);
                
                if (cameras && cameras.length > 0) {
                    // Preferir cámara trasera (última en la lista generalmente)
                    const cameraId = cameras[cameras.length - 1].id;
                    console.log('🎥 Usando cámara html5-qrcode:', cameraId);
                    
                    await this.html5QrCode.start(
                        cameraId,
                        config,
                        this._onScanSuccess.bind(this),
                        this._onScanFailure.bind(this)
                    );
                } else {
                    throw new Error('No se encontraron cámaras');
                }
                
            } catch (cameraError) {
                console.log('⚠️ Error con cámaras específicas, usando constrains genéricos...');
                
                // Fallback con constrains (misma lógica que ScannerModule actual)
                await this.html5QrCode.start(
                    this.config.cameraConstraints,
                    config,
                    this._onScanSuccess.bind(this),
                    this._onScanFailure.bind(this)
                );
            }

            this.isScanning = true;
            console.log('✅ Escaneo html5-qrcode iniciado correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error iniciando escaneo html5-qrcode:', error);
            this.isScanning = false;
            
            if (this.scanCallbacks.onError) {
                this.scanCallbacks.onError(error, this._getErrorMessage(error));
            }
            
            throw error;
        }
    }

    /**
     * Callback para escaneo exitoso (heredado del ScannerModule)
     * @private
     */
    _onScanSuccess(decodedText, decodedResult) {
        if (!this.isScanning) return;

        const scanTime = performance.now();
        this._updateStats(scanTime - this.stats.lastScanTime, true);
        
        console.log('🎯 Código detectado con html5-qrcode:', decodedText);
        
        // Detener escaneo
        this.isScanning = false;
        
        if (this.scanCallbacks.onSuccess) {
            this.scanCallbacks.onSuccess(
                decodedText,
                {
                    format: decodedResult?.decodedText ? 'DETECTED' : 'UNKNOWN',
                    rawResult: decodedResult,
                    engine: 'javascript',
                    scanTime: scanTime - this.stats.lastScanTime,
                    confidence: 0.8, // html5-qrcode tiene buena confianza
                    legacy: true, // Marcador para indicar que es el motor legacy
                    cdnUsed: this.stats.successfulCdn // Información adicional del CDN usado
                }
            );
        }
    }

    /**
     * Callback para errores de escaneo (normal durante el proceso)
     * @private
     */
    _onScanFailure(error) {
        // Error silencioso durante escaneo - es normal que ocurra
        // Solo actualizar estadísticas sin notificar errores menores
        this._updateStats(0, false);
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
            console.log('⏹️ Deteniendo escaneo html5-qrcode...');
            
            this.isScanning = false;

            if (this.html5QrCode) {
                try {
                    await this.html5QrCode.stop();
                    console.log('🛑 html5-qrcode detenido correctamente');
                } catch (stopError) {
                    console.warn('⚠️ Error deteniendo html5-qrcode:', stopError);
                }

                try {
                    this.html5QrCode.clear();
                    console.log('🧹 html5-qrcode limpiado');
                } catch (clearError) {
                    console.warn('⚠️ Error limpiando html5-qrcode:', clearError);
                }
            }

            console.log('✅ Escaneo html5-qrcode detenido');
            console.log('📊 Estadísticas finales html5-qrcode:', this.stats);
        } catch (error) {
            console.error('⚠️ Error deteniendo escaneo html5-qrcode:', error);
        }
    }

    /**
     * Limpiar recursos
     * @returns {Promise<void>}
     */
    async destroy() {
        await this.stop();
        
        this.html5QrCode = null;
        this.videoElement = null;
        this.scanCallbacks = { onSuccess: null, onError: null };
        
        // Resetear estadísticas
        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            libraryLoadTime: 0,
            initializationTime: 0,
            cdnAttempts: [],
            successfulCdn: null,
            loadingRetries: 0,
            availabilityChecks: 0
        };
        
        console.log('🧹 html5-qrcode engine destruido');
    }

    /**
     * Obtener información del motor
     * @returns {Object}
     */
    getInfo() {
        return {
            name: 'html5-qrcode (JavaScript)',
            type: 'javascript',
            performance: 'basic',
            formats: this.config.scannerConfig.formatsToSupport || ['QR_CODE', 'CODE_128', 'EAN_13', 'UPC_A'],
            stats: { ...this.stats },
            isActive: this.isScanning,
            isLibraryLoaded: this.isLibraryLoaded,
            cdnInfo: {
                successfulCdn: this.stats.successfulCdn,
                loadingAttempts: this.stats.cdnAttempts.length,
                loadingRetries: this.stats.loadingRetries,
                totalLoadTime: this.stats.libraryLoadTime,
                availabilityChecks: this.stats.cdnAttempts.reduce((sum, a) => sum + (a.availabilityChecks || 0), 0)
            },
            connectionInfo: this.connectionInfo,
            capabilities: {
                realTime: true,
                highAccuracy: false,
                lowLatency: false,
                hardwareAccelerated: false,
                universalCompatibility: true,
                legacy: true,
                optimizedLoading: true // Nueva característica
            }
        };
    }

    /**
     * Obtener mensaje de error amigable (heredado del ScannerModule)
     * @private
     */
    _getErrorMessage(error) {
        if (error.name === 'NotAllowedError') {
            return 'Permisos de cámara denegados. Permite el acceso en la configuración de tu navegador y recarga la página.';
        } else if (error.name === 'NotFoundError') {
            return 'No se encontró ninguna cámara en el dispositivo. Puedes introducir el código manualmente.';
        } else if (error.name === 'NotSupportedError') {
            return 'El navegador no soporta acceso a la cámara.';
        } else if (error.name === 'NotReadableError') {
            return 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            return 'Las restricciones de cámara no pueden ser satisfechas.';
        } else if (error.message && error.message.includes('HTTPS')) {
            return 'HTTPS requerido para acceso a la cámara en móviles.';
        } else if (error.message && (error.message.includes('librería') || error.message.includes('escáner') || error.message.includes('CDN'))) {
            return `No se pudo cargar html5-qrcode desde CDNs. ${this.connectionInfo.isSlowConnection ? 'Conexión lenta detectada.' : ''} Puede ser debido a un adblocker o restricciones de red. Desactiva tu adblocker y recarga la página.`;
        }
        
        return 'Error inesperado: ' + (error.message || 'Error desconocido');
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
     * Obtener estadísticas de rendimiento
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
                initialization: this.stats.initializationTime,
                total: this.stats.libraryLoadTime + this.stats.initializationTime
            },
            cdnPerformance: {
                successfulCdn: this.stats.successfulCdn,
                totalAttempts: this.stats.cdnAttempts.length,
                failedAttempts: this.stats.loadingRetries,
                averageAttemptTime: this.stats.cdnAttempts.length > 0 ?
                    this.stats.cdnAttempts.reduce((sum, attempt) => sum + attempt.loadTime, 0) / this.stats.cdnAttempts.length : 0,
                cdnReliability: this.stats.cdnAttempts.length > 0 ?
                    ((this.stats.cdnAttempts.length - this.stats.loadingRetries) / this.stats.cdnAttempts.length) * 100 : 0,
                totalAvailabilityChecks: this.stats.cdnAttempts.reduce((sum, a) => sum + (a.availabilityChecks || 0), 0)
            },
            connectionOptimization: {
                connectionType: this.connectionInfo.effectiveType,
                isSlowConnection: this.connectionInfo.isSlowConnection,
                isVerySlowConnection: this.connectionInfo.isVerySlowConnection,
                isOptimizedForConnection: this.connectionInfo.isVerySlowConnection ? 
                    this.stats.cdnAttempts.length <= 4 : 
                    this.connectionInfo.isSlowConnection ? 
                        this.stats.cdnAttempts.length <= 6 : true,
                downlink: this.connectionInfo.downlink,
                rtt: this.connectionInfo.rtt,
                saveData: this.connectionInfo.saveData
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
            totalAvailabilityChecks: this.stats.cdnAttempts.reduce((sum, a) => sum + (a.availabilityChecks || 0), 0),
            connectionInfo: this.connectionInfo,
            optimization: {
                cdnsOptimized: true,
                regionOptimized: true,
                connectionOptimized: this.connectionInfo.isSlowConnection || this.connectionInfo.isVerySlowConnection,
                availabilityCheckingEnabled: true
            }
        };
    }

    /**
     * Obtener configuración optimizada para la conexión actual
     * @returns {Object}
     */
    getOptimizedConfig() {
        const baseConfig = { ...this.config.scannerConfig };
        
        // Optimizar configuración según conexión
        if (this.connectionInfo.isVerySlowConnection) {
            // Para conexiones muy lentas, reducir FPS y calidad
            baseConfig.fps = 5;
            baseConfig.qrbox = { width: 250, height: 150 };
        } else if (this.connectionInfo.isSlowConnection) {
            // Para conexiones lentas, reducir un poco los parámetros
            baseConfig.fps = 8;
            baseConfig.qrbox = { width: 280, height: 170 };
        }
        
        return baseConfig;
    }

    /**
     * Pre-cargar librería para optimizar siguientes usos
     * @static
     */
    static async preload() {
        try {
            if (typeof Html5Qrcode !== 'undefined') {
                console.log('✅ html5-qrcode ya pre-cargado');
                return true;
            }

            console.log('⚡ Pre-cargando html5-qrcode...');
            const engine = new HTML5QRCodeEngine();
            await engine._loadHTML5QRCodeLibrary();
            console.log('✅ html5-qrcode pre-cargado exitosamente');
            return true;
        } catch (error) {
            console.warn('⚠️ Error pre-cargando html5-qrcode:', error);
            return false;
        }
    }

    /**
     * Verificar qué CDNs están disponibles (utilidad de diagnóstico)
     * @static
     */
    static async testCdnAvailability() {
        const engine = new HTML5QRCodeEngine();
        const results = [];
        
        console.log('🧪 Probando disponibilidad de CDNs html5-qrcode...');
        
        for (const [index, url] of engine.config.cdnUrls.entries()) {
            const start = performance.now();
            try {
                const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                const time = performance.now() - start;
                results.push({
                    url,
                    name: engine._getCdnName(url),
                    available: true,
                    responseTime: time,
                    index
                });
                console.log(`✅ ${engine._getCdnName(url)}: ${time.toFixed(1)}ms`);
            } catch (error) {
                const time = performance.now() - start;
                results.push({
                    url,
                    name: engine._getCdnName(url),
                    available: false,
                    responseTime: time,
                    error: error.message,
                    index
                });
                console.log(`❌ ${engine._getCdnName(url)}: Error - ${error.message}`);
            }
        }
        
        console.table(results);
        return results;
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTML5QRCodeEngine;
} else if (typeof window !== 'undefined') {
    window.HTML5QRCodeEngine = HTML5QRCodeEngine;
}