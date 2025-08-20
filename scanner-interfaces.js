/**
 * Scanner Interfaces - Sistema unificado de detección y gestión de motores de escaneo
 * Versión: 2.0.0 - Arquitectura híbrida con múltiples motores
 */

/**
 * Interfaz común para todos los motores de escaneo
 */
class IScannerEngine {
    constructor() {
        if (this.constructor === IScannerEngine) {
            throw new Error('IScannerEngine es una interfaz abstracta');
        }
    }

    /**
     * Verificar si el motor está disponible en el navegador actual
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        throw new Error('Método isAvailable debe ser implementado');
    }

    /**
     * Inicializar el motor de escaneo
     * @param {string} elementId - ID del elemento DOM para el video
     * @param {Object} config - Configuración del escáner
     * @returns {Promise<boolean>}
     */
    async initialize(elementId, config) {
        throw new Error('Método initialize debe ser implementado');
    }

    /**
     * Iniciar el escaneo
     * @param {Function} onSuccess - Callback para códigos detectados
     * @param {Function} onError - Callback para errores
     * @returns {Promise<boolean>}
     */
    async start(onSuccess, onError) {
        throw new Error('Método start debe ser implementado');
    }

    /**
     * Detener el escaneo
     * @returns {Promise<void>}
     */
    async stop() {
        throw new Error('Método stop debe ser implementado');
    }

    /**
     * Limpiar recursos
     * @returns {Promise<void>}
     */
    async destroy() {
        throw new Error('Método destroy debe ser implementado');
    }

    /**
     * Obtener información del motor
     * @returns {Object}
     */
    getInfo() {
        throw new Error('Método getInfo debe ser implementado');
    }
}

/**
 * Detector de capacidades del navegador para diferentes motores de escaneo
 */
class ScannerCapabilityDetector {
    constructor() {
        this.capabilities = null;
        this.detectionPromise = null;
    }

    /**
     * Detectar todas las capacidades disponibles
     * @returns {Promise<Object>}
     */
    async detectCapabilities() {
        if (this.detectionPromise) {
            return this.detectionPromise;
        }

        this.detectionPromise = this._performDetection();
        return this.detectionPromise;
    }

    /**
     * Realizar la detección de capacidades
     * @private
     */
    async _performDetection() {
        console.log('🔍 Detectando capacidades de escaneo del navegador...');

        const capabilities = {
            // Información del navegador
            browser: this._getBrowserInfo(),
            
            // APIs nativas
            barcodeDetector: await this._checkBarcodeDetectorAPI(),
            
            // WebAssembly
            webAssembly: this._checkWebAssemblySupport(),
            
            // Capacidades de cámara
            camera: await this._checkCameraCapabilities(),
            
            // Contexto de seguridad
            security: this._checkSecurityContext(),
            
            // Rendimiento estimado
            performance: this._estimatePerformance()
        };

        this.capabilities = capabilities;
        console.log('✅ Capacidades detectadas:', capabilities);
        
        return capabilities;
    }

    /**
     * Obtener información del navegador
     * @private
     */
    _getBrowserInfo() {
        const ua = navigator.userAgent;
        const info = {
            userAgent: ua,
            isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
            isFirefox: /Firefox/.test(ua),
            isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
            isEdge: /Edge/.test(ua),
            isMobile: /Mobi|Android/i.test(ua),
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isAndroid: /Android/.test(ua)
        };

        // Detectar versiones específicas
        if (info.isChrome) {
            const match = ua.match(/Chrome\/(\d+)/);
            info.version = match ? parseInt(match[1]) : 0;
        }

        return info;
    }

    /**
     * Verificar disponibilidad de BarcodeDetector API
     * @private
     */
    async _checkBarcodeDetectorAPI() {
        try {
            if (!('BarcodeDetector' in window)) {
                return {
                    available: false,
                    reason: 'API no disponible en este navegador'
                };
            }

            // Verificar formatos soportados
            const supportedFormats = await BarcodeDetector.getSupportedFormats();
            
            // Intentar crear una instancia
            const detector = new BarcodeDetector({
                formats: supportedFormats.filter(format => 
                    ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'].includes(format)
                )
            });

            return {
                available: true,
                supportedFormats,
                instance: detector,
                performance: 'native' // Máximo rendimiento
            };
        } catch (error) {
            return {
                available: false,
                reason: `Error creando BarcodeDetector: ${error.message}`
            };
        }
    }

    /**
     * Verificar soporte de WebAssembly
     * @private
     */
    _checkWebAssemblySupport() {
        try {
            if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
                // Verificar si puede crear un módulo simple
                const module = new WebAssembly.Module(new Uint8Array([
                    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
                ]));
                
                return {
                    available: true,
                    streaming: 'instantiateStreaming' in WebAssembly,
                    performance: 'high' // Alto rendimiento
                };
            }
        } catch (error) {
            // Intentar fallback más simple
            if ('WebAssembly' in window) {
                return {
                    available: true,
                    streaming: false,
                    performance: 'medium',
                    limitations: 'Soporte básico de WASM'
                };
            }
        }
        
        return {
            available: false,
            reason: 'WebAssembly no soportado'
        };
    }

    /**
     * Verificar capacidades de cámara
     * @private
     */
    async _checkCameraCapabilities() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return {
                    available: false,
                    reason: 'getUserMedia no disponible'
                };
            }

            // Verificar permisos sin solicitar acceso
            let permissionStatus = 'unknown';
            if (navigator.permissions) {
                try {
                    const permission = await navigator.permissions.query({ name: 'camera' });
                    permissionStatus = permission.state;
                } catch (e) {
                    // Ignorar errores de permisos
                }
            }

            // Intentar enumerar dispositivos
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            return {
                available: true,
                deviceCount: videoDevices.length,
                hasBackCamera: videoDevices.some(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear')
                ),
                permissionStatus,
                constraints: {
                    facingMode: videoDevices.length > 1,
                    torch: false // Se verificará después
                }
            };
        } catch (error) {
            return {
                available: false,
                reason: `Error accediendo a cámara: ${error.message}`
            };
        }
    }

    /**
     * Verificar contexto de seguridad
     * @private
     */
    _checkSecurityContext() {
        return {
            isSecureContext: window.isSecureContext,
            protocol: location.protocol,
            hostname: location.hostname,
            isLocalhost: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
            httpsRequired: location.protocol !== 'https:' && !this._isLocalhost()
        };
    }

    /**
     * Estimar rendimiento del dispositivo
     * @private
     */
    _estimatePerformance() {
        const performance = {
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: navigator.deviceMemory || 'unknown',
            connection: null,
            estimated: 'medium'
        };

        // Información de conexión si está disponible
        if (navigator.connection) {
            performance.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }

        // Estimar rendimiento basado en características
        if (performance.hardwareConcurrency >= 8 && performance.deviceMemory >= 4) {
            performance.estimated = 'high';
        } else if (performance.hardwareConcurrency >= 4 && performance.deviceMemory >= 2) {
            performance.estimated = 'medium';
        } else {
            performance.estimated = 'low';
        }

        return performance;
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
     * Obtener el motor recomendado basado en las capacidades
     * @returns {Promise<string>}
     */
    async getRecommendedEngine() {
        const capabilities = await this.detectCapabilities();

        // Prioridad 1: BarcodeDetector nativo (máximo rendimiento)
        if (capabilities.barcodeDetector.available) {
            console.log('🚀 Motor recomendado: BarcodeDetector (Nativo)');
            return 'native';
        }

        // Prioridad 2: WebAssembly (alto rendimiento)
        if (capabilities.webAssembly.available && capabilities.performance.estimated !== 'low') {
            console.log('⚡ Motor recomendado: ZXing WASM (Alto rendimiento)');
            return 'wasm';
        }

        // Prioridad 3: JavaScript (compatibilidad)
        console.log('🔄 Motor recomendado: html5-qrcode (Compatibilidad)');
        return 'javascript';
    }

    /**
     * Obtener capacidades ya detectadas (sin nueva detección)
     * @returns {Object|null}
     */
    getCapabilities() {
        return this.capabilities;
    }

    /**
     * Verificar si un motor específico está disponible
     * @param {string} engineType - Tipo de motor ('native', 'wasm', 'javascript')
     * @returns {Promise<boolean>}
     */
    async isEngineAvailable(engineType) {
        const capabilities = await this.detectCapabilities();
        
        switch (engineType) {
            case 'native':
                return capabilities.barcodeDetector.available;
            case 'wasm':
                return capabilities.webAssembly.available;
            case 'javascript':
                return true; // Siempre disponible como fallback
            default:
                return false;
        }
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IScannerEngine, ScannerCapabilityDetector };
} else if (typeof window !== 'undefined') {
    window.IScannerEngine = IScannerEngine;
    window.ScannerCapabilityDetector = ScannerCapabilityDetector;
}