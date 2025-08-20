/**
 * Módulo Scanner - Gestión completa del escáner de códigos de barras
 * Versión: 2.1.0 - Arquitectura híbrida con detección mejorada de dispositivos
 * 
 * NUEVA ARQUITECTURA:
 * - BarcodeDetector API nativo (máximo rendimiento)
 * - ZXing WebAssembly (alto rendimiento)
 * - html5-qrcode (compatibilidad universal)
 * - Selección automática y fallbacks transparentes
 * - Detección mejorada de dispositivos sin cámara
 */

class ScannerModule {
    constructor() {
        // Nueva arquitectura híbrida
        this.scannerFactory = null;
        this.activeEngine = null;
        this.engineInfo = null;
        
        // Estado del escáner (compatible con versión anterior)
        this.cameraPermissionStatus = 'unknown';
        this.isInitialized = false;
        this.hasRequestedPermissionBefore = false;
        this.lastErrorMessage = null;
        
        // Callbacks externos (misma interfaz que antes)
        this.callbacks = {
            onScanSuccess: null,
            onScanError: null,
            onPermissionChange: null,
            onStatusUpdate: null
        };

        // Configuración mejorada
        this.config = {
            // Configuración heredada para compatibilidad
            fps: 10,
            qrbox: { width: 320, height: 200 },
            aspectRatio: 1.6,
            
            // Nueva configuración de la factory
            fallbackEnabled: true,
            autoSelectEngine: true,
            cachePreferences: true,
            
            // Timeouts y reintentos
            initTimeout: 15000,
            maxRetries: 3,
            retryDelay: 1000
        };

        // Estadísticas mejoradas
        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            consecutiveErrors: 0,
            engineSwitches: 0,
            sessionStartTime: Date.now()
        };

        // Auto-inicializar la factory
        this._initializeFactory();
    }

    /**
     * Inicializar la Scanner Factory
     * @private
     */
    async _initializeFactory() {
        try {
            console.log('🭠 Inicializando Scanner Factory híbrida...');
            
            // Verificar que todas las dependencias estén cargadas
            if (typeof ScannerFactory === 'undefined') {
                throw new Error('ScannerFactory no disponible. Asegúrate de cargar scanner-factory.js');
            }

            this.scannerFactory = new ScannerFactory();
            
            // Configurar callbacks de la factory
            this.scannerFactory.setCallbacks({
                onEngineSelected: this._onEngineSelected.bind(this),
                onFallbackUsed: this._onFallbackUsed.bind(this),
                onStatusUpdate: this._onFactoryStatusUpdate.bind(this)
            });

            console.log('✅ Scanner Factory inicializada correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Scanner Factory:', error);
            this.lastErrorMessage = `Error de inicialización: ${error.message}`;
        }
    }

    /**
     * Configurar callbacks externos (interfaz compatible)
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Verificar compatibilidad del navegador (implementación mejorada v2.1)
     */
    checkCompatibility() {
        try {
            // Verificación básica de contexto seguro
            const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
            const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
            
            if (!isSecureContext) {
                throw new Error('HTTPS requerido para acceso a la cámara en móviles');
            }
            
            if (!hasMediaDevices) {
                // Detección mejorada de escritorio sin cámara
                const deviceInfo = this._detectDeviceType();
                
                if (deviceInfo.isDesktop && !deviceInfo.likelyHasCamera) {
                    console.log('🖥️ Escritorio sin cámara detectado:', deviceInfo);
                    throw new Error('DESKTOP_NO_CAMERA');
                }
                throw new Error('Tu navegador no soporta acceso a la cámara');
            }
            
            return true;
        } catch (error) {
            this.lastErrorMessage = this.getErrorMessage(error);
            throw error;
        }
    }

    /**
     * Detectar tipo de dispositivo con mayor precisión
     * @private
     * @returns {Object} Información detallada del dispositivo
     */
    _detectDeviceType() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const screen = window.screen;
        const touch = 'ontouchstart' in window;
        const maxTouchPoints = navigator.maxTouchPoints || 0;
        
        // Detectar móviles/tablets claramente
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android.*Tablet|PlayBook|Silk/i.test(userAgent) || 
                         (screen.width >= 768 && screen.height >= 1024);
        
        // Detectar sistemas de escritorio
        const isWindows = /Windows/i.test(platform);
        const isMac = /Mac/i.test(platform);
        const isLinux = /Linux/i.test(platform) && !isMobile;
        const isDesktopOS = isWindows || isMac || isLinux;
        
        // Heurísticas para detectar si probablemente tenga cámara
        const likelyHasCamera = 
            isMobile || // Móviles casi siempre tienen cámara
            isTablet || // Tablets generalmente tienen cámara
            (touch && maxTouchPoints > 0) || // Dispositivos táctiles modernos
            /Chrome OS/i.test(userAgent) || // Chromebooks tienen cámara
            (screen.width <= 1366 && screen.height <= 768); // Laptops más probables que desktop
        
        // Clasificación final
        let deviceType = 'unknown';
        if (isMobile) deviceType = 'mobile';
        else if (isTablet) deviceType = 'tablet';
        else if (isDesktopOS && !touch) deviceType = 'desktop';
        else if (touch) deviceType = 'touchscreen';
        
        const deviceInfo = {
            type: deviceType,
            isDesktop: deviceType === 'desktop',
            isMobile,
            isTablet,
            isDesktopOS,
            hasTouch: touch,
            touchPoints: maxTouchPoints,
            likelyHasCamera,
            screenSize: `${screen.width}x${screen.height}`,
            userAgent: userAgent.substring(0, 100) + '...', // Truncado para logs
            platform
        };
        
        console.log('📱 Dispositivo detectado:', deviceInfo);
        return deviceInfo;
    }

    /**
     * Verificar permisos persistentes (mejorado)
     */
    async checkPersistedPermissions() {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                this.cameraPermissionStatus = permission.state;
                
                if (permission.state === 'granted') {
                    this.hasRequestedPermissionBefore = true;
                }
                
                console.log('🔍 Permisos persistentes verificados:', permission.state);
                
                // Escuchar cambios en permisos
                permission.onchange = () => {
                    this.cameraPermissionStatus = permission.state;
                    console.log('🔄 Permisos de cámara cambiaron a:', permission.state);
                    
                    if (this.callbacks.onPermissionChange) {
                        this.callbacks.onPermissionChange(permission.state);
                    }
                };
            }
        } catch (error) {
            console.log('⚠️ Error verificando permisos persistentes:', error);
        }
    }

    /**
     * Solicitar permisos de cámara (interfaz compatible)
     */
    async requestCameraPermission() {
        try {
            console.log('📹 Solicitando permisos de cámara...');
            
            // Verificación de compatibilidad básica
            this.checkCompatibility();
            
            // Configuración de cámara optimizada
            const constraints = { 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    focusMode: { ideal: "continuous" } // Para mejor enfoque
                } 
            };

            // Intentar con configuración avanzada primero
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('✅ Permisos concedidos con configuración avanzada');
            } catch (advancedError) {
                console.log('⚠️ Configuración avanzada no disponible, usando básica');
                
                // Detectar específicamente NotFoundError en escritorio con detección mejorada
                if (advancedError.name === 'NotFoundError') {
                    const deviceInfo = this._detectDeviceType();
                    if (deviceInfo.isDesktop && !deviceInfo.likelyHasCamera) {
                        console.log('🖥️ Confirmado: Escritorio sin cámara -', deviceInfo.type);
                        throw new Error('DESKTOP_NO_CAMERA');
                    }
                }
                
                // Fallback a configuración básica
                const basicConstraints = {
                    video: { 
                        facingMode: "environment",
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
                console.log('✅ Permisos concedidos con configuración básica');
            }
            
            // Cerrar stream inmediatamente después de verificar permisos
            stream.getTracks().forEach(track => track.stop());
            this.cameraPermissionStatus = 'granted';
            this.hasRequestedPermissionBefore = true;
            
            return true;
        } catch (error) {
            console.error('❌ Error de permisos de cámara:', error);
            this.cameraPermissionStatus = 'denied';
            this.lastErrorMessage = this.getErrorMessage(error);
            throw error;
        }
    }

    /**
     * Activar la cámara y preparar el escáner (nueva implementación híbrida)
     */
    async activateCamera() {
        try {
            console.log('🚀 Activando cámara con arquitectura híbrida...');
            
            // Si ya tenemos permisos, saltar verificación
            if (this.cameraPermissionStatus === 'granted' && this.hasRequestedPermissionBefore) {
                console.log('✅ Permisos ya concedidos, preparando motor...');
                this.updateStatus('Preparando motor de escaneo...');
                return true;
            }

            // Verificar compatibilidad
            this.updateStatus('Verificando compatibilidad...');
            this.checkCompatibility();
            
            // Solicitar permisos de cámara
            this.updateStatus('Solicitando permisos de cámara...');
            await this.requestCameraPermission();
            
            this.updateStatus('Cámara activada correctamente');
            return true;
            
        } catch (error) {
            console.error('Error activando cámara:', error);
            const errorMessage = this.getErrorMessage(error);
            this.lastErrorMessage = errorMessage;
            
            this.updateStatus(errorMessage);
            
            if (this.callbacks.onScanError) {
                this.callbacks.onScanError(error, errorMessage);
            }
            
            throw error;
        }
    }

    /**
     * Inicializar el escáner (nueva implementación con factory)
     */
    async initializeScanner(elementId = 'qr-reader') {
        if (this.cameraPermissionStatus !== 'granted') {
            console.log('Permisos de cámara no otorgados');
            return false;
        }

        try {
            this.updateStatus('Inicializando motor de escaneo...');
            
            // Asegurar que la factory esté inicializada
            if (!this.scannerFactory) {
                await this._initializeFactory();
            }
            
            // Obtener motor óptimo de la factory
            console.log('🎯 Obteniendo motor óptimo...');
            this.activeEngine = await this.scannerFactory.getEngine(elementId, this.config);
            this.engineInfo = this.activeEngine.getInfo();
            
            this.updateStatus('Motor listo, iniciando escaneo...');
            console.log('✅ Motor de escaneo configurado:', this.engineInfo.name);

            // Iniciar escaneo con el motor seleccionado
            await this.activeEngine.start(
                this._onScanSuccess.bind(this),
                this._onScanError.bind(this)
            );

            this.updateStatus('Buscando código de barras...');
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('Error inicializando escáner:', error);
            const errorMessage = this.getErrorMessage(error);
            this.lastErrorMessage = errorMessage;
            
            this.updateStatus(errorMessage);
            
            if (this.callbacks.onScanError) {
                this.callbacks.onScanError(error, errorMessage);
            }
            
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Callback cuando se escanea un código exitosamente (mejorado)
     * @private
     */
    _onScanSuccess(decodedText, decodedResult) {
        console.log('🎯 Código escaneado exitosamente:', decodedText);
        console.log('📊 Detalles del escaneo:', decodedResult);
        
        // Actualizar estadísticas
        this._updateStats(decodedResult.scanTime || 0, true);
        
        // Registrar en factory
        if (this.scannerFactory) {
            this.scannerFactory.recordScanSuccess();
        }
        
        // Detener motor actual
        this.stop();
        
        // Notificar éxito
        if (this.callbacks.onScanSuccess) {
            this.callbacks.onScanSuccess(decodedText, decodedResult);
        }
    }

    /**
     * Callback cuando falla el escaneo
     * @private
     */
    _onScanError(error, message) {
        console.warn('⚠️ Error en escaneo:', error, message);
        
        // Actualizar estadísticas
        this.stats.consecutiveErrors++;
        
        // Registrar en factory
        if (this.scannerFactory) {
            this.scannerFactory.recordScanFailure();
        }
        
        // Solo notificar errores críticos
        const criticalMessages = ['error', 'denegado', 'bloqueado', 'adblocker', 'conexión', 'red'];
        const isCritical = criticalMessages.some(keyword => message.toLowerCase().includes(keyword));
        
        if (isCritical && this.callbacks.onScanError) {
            this.callbacks.onScanError(error, message);
        }
    }

    /**
     * Callback cuando se selecciona un motor
     * @private
     */
    _onEngineSelected(engineType, engineInfo) {
        console.log(`🔧 Motor seleccionado: ${engineType}`);
        console.log('📋 Info del motor:', engineInfo);
        
        this.engineInfo = engineInfo;
        this.stats.engineSwitches++;
        
        this.updateStatus(`Usando motor ${engineInfo.name}`);
    }

    /**
     * Callback cuando se usa un fallback
     * @private
     */
    _onFallbackUsed(originalEngine, error) {
        console.log(`🔄 Fallback desde ${originalEngine} debido a:`, error);
        this.stats.engineSwitches++;
        this.updateStatus(`Cambiando a motor alternativo...`);
    }

    /**
     * Callback para updates de status de la factory
     * @private
     */
    _onFactoryStatusUpdate(message) {
        this.updateStatus(message);
    }

    /**
     * Detener el escáner (interfaz compatible)
     */
    stop() {
        if (this.activeEngine) {
            try {
                console.log('⏹️ Deteniendo motor de escaneo...');
                this.activeEngine.stop().then(() => {
                    console.log('✅ Motor detenido correctamente');
                }).catch(err => {
                    console.error('Error deteniendo el motor:', err);
                }).finally(() => {
                    this.isInitialized = false;
                });
            } catch (error) {
                console.error('Error deteniendo el motor:', error);
                this.isInitialized = false;
            }
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
            this.stats.consecutiveErrors = 0; // Resetear errores consecutivos
        }
        
        if (scanTime > 0) {
            this.stats.averageTime = (this.stats.averageTime * 0.9) + (scanTime * 0.1);
        }
    }

    /**
     * Actualizar estado y notificar (interfaz compatible)
     */
    updateStatus(message) {
        console.log('📊 Estado del escáner:', message);
        
        if (this.callbacks.onStatusUpdate) {
            this.callbacks.onStatusUpdate(message);
        }
    }

    /**
     * Obtener estado actual del escáner (interfaz mejorada)
     */
    getStatus() {
        const baseStatus = {
            isInitialized: this.isInitialized,
            cameraPermissionStatus: this.cameraPermissionStatus,
            hasActiveReader: !!this.activeEngine,
            hasRequestedPermissionBefore: this.hasRequestedPermissionBefore,
            lastErrorMessage: this.lastErrorMessage
        };

        // Información adicional de la nueva arquitectura
        if (this.engineInfo) {
            baseStatus.engine = this.engineInfo;
        }

        if (this.scannerFactory) {
            baseStatus.factory = this.scannerFactory.getStats();
            baseStatus.availableEngines = this.scannerFactory.getAvailableEngines();
        }

        baseStatus.stats = this.stats;

        return baseStatus;
    }

    /**
     * Generar mensaje de error amigable (interfaz mejorada v2.1)
     */
    getErrorMessage(error) {
        console.error('Detalle del error:', error);
        
        if (error.message === 'DESKTOP_NO_CAMERA') {
            // Mensaje más específico basado en detección mejorada
            const deviceInfo = this._detectDeviceType();
            const deviceName = deviceInfo.isDesktopOS ? 
                (deviceInfo.platform.includes('Mac') ? 'Mac' :
                 deviceInfo.platform.includes('Win') ? 'PC con Windows' : 'equipo de escritorio') :
                'dispositivo';
                
            return `No se detectó ninguna cámara en este ${deviceName}. Puedes introducir el código manualmente más abajo.`;
        } else if (error.name === 'NotAllowedError') {
            return 'Permisos de cámara denegados. Permite el acceso en la configuración de tu navegador y recarga la página.';
        } else if (error.name === 'NotFoundError') {
            // Distinguir entre diferentes escenarios de "no encontrado"
            const deviceInfo = this._detectDeviceType();
            if (deviceInfo.isMobile) {
                return 'No se encontró cámara en tu dispositivo móvil. Verifica que no esté siendo usada por otra aplicación.';
            } else if (deviceInfo.isTablet) {
                return 'No se encontró cámara en tu tablet. Puedes introducir el código manualmente.';
            } else {
                return 'No se encontró ninguna cámara en el dispositivo. Puedes introducir el código manualmente.';
            }
        } else if (error.name === 'NotSupportedError') {
            return 'El navegador no soporta acceso a la cámara.';
        } else if (error.name === 'NotReadableError') {
            return 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            return 'Las restricciones de cámara no pueden ser satisfechas.';
        } else if (error.message && error.message.includes('HTTPS')) {
            return 'HTTPS requerido para acceso a la cámara en móviles.';
        } else if (error.message && (error.message.includes('librería') || error.message.includes('escáner') || error.message.includes('CDN') || error.message.includes('Factory'))) {
            return 'No se pudo cargar el escáner. Puede ser debido a un adblocker o restricciones de red. Desactiva tu adblocker y recarga la página.';
        }
        
        return 'Error inesperado: ' + (error.message || 'Error desconocido');
    }

    /**
     * Limpiar recursos al destruir el módulo (mejorado)
     */
    destroy() {
        this.stop();
        
        if (this.scannerFactory) {
            this.scannerFactory.destroy();
            this.scannerFactory = null;
        }
        
        this.activeEngine = null;
        this.engineInfo = null;
        this.callbacks = {};
        this.lastErrorMessage = null;
        
        // Resetear estadísticas
        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            consecutiveErrors: 0,
            engineSwitches: 0,
            sessionStartTime: Date.now()
        };
        
        console.log('🧹 Scanner Module destruido completamente');
    }

    /**
     * Obtener información detallada del motor actual
     * @returns {Object|null}
     */
    getEngineInfo() {
        if (this.scannerFactory) {
            return this.scannerFactory.getCurrentEngineInfo();
        }
        return this.engineInfo;
    }

    /**
     * Obtener estadísticas combinadas del módulo y factory
     * @returns {Object}
     */
    getDetailedStats() {
        const moduleStats = this.stats;
        const factoryStats = this.scannerFactory ? this.scannerFactory.getStats() : {};
        
        return {
            module: moduleStats,
            factory: factoryStats,
            combined: {
                totalScans: moduleStats.scansPerformed,
                successRate: moduleStats.scansPerformed > 0 ? 
                    (moduleStats.successfulScans / moduleStats.scansPerformed) * 100 : 0,
                averageResponseTime: moduleStats.averageTime,
                engineSwitches: moduleStats.engineSwitches,
                sessionDuration: Date.now() - moduleStats.sessionStartTime
            }
        };
    }

    /**
     * Forzar motor específico (para debugging)
     * @param {string} engineType - 'native', 'wasm', o 'javascript'
     */
    forceEngine(engineType) {
        if (this.scannerFactory) {
            this.scannerFactory.forceEngine(engineType);
            console.log(`🔧 Motor forzado a: ${engineType}`);
        } else {
            console.warn('⚠️ Factory no disponible para forzar motor');
        }
    }

    /**
     * Verificar si un motor específico está disponible
     * @param {string} engineType
     * @returns {Promise<boolean>}
     */
    async isEngineAvailable(engineType) {
        if (this.scannerFactory) {
            return await this.scannerFactory._isEngineAvailable(engineType);
        }
        return false;
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScannerModule;
} else if (typeof window !== 'undefined') {
    window.ScannerModule = ScannerModule;
}