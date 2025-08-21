/**
 * BarcodeDetector Engine - Motor de escaneo usando BarcodeDetector API nativa
 * Versión: 2.0.0 - Máximo rendimiento con API nativa del navegador
 */

class BarcodeDetectorEngine extends IScannerEngine {
    constructor() {
        super();
        this.detector = null;
        this.videoElement = null;
        this.stream = null;
        this.animationFrame = null;
        this.isScanning = false;
        this.scanCallbacks = {
            onSuccess: null,
            onError: null
        };

        // Configuración específica para BarcodeDetector
        this.config = {
            // Formatos que queremos detectar (orden de prioridad)
            preferredFormats: [
                'code_128',    // Códigos de barras más comunes
                'code_39',
                'ean_13',
                'ean_8', 
                'upc_a',
                'upc_e',
                'qr_code'      // QR codes también
            ],
            // Configuración de escaneo
            scanInterval: 100,  // ms entre escaneos (10 FPS)
            maxRetries: 3,
            errorThreshold: 5   // Errores consecutivos antes de fallar
        };

        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            consecutiveErrors: 0
        };
    }

    /**
     * Verificar si BarcodeDetector está disponible
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            if (!('BarcodeDetector' in window)) {
                console.log('❌ BarcodeDetector API no disponible en este navegador');
                return false;
            }

            // Verificar formatos soportados
            const supportedFormats = await BarcodeDetector.getSupportedFormats();
            const availableFormats = this.config.preferredFormats.filter(format => 
                supportedFormats.includes(format)
            );

            if (availableFormats.length === 0) {
                console.log('❌ Ningún formato de código soportado por BarcodeDetector');
                return false;
            }

            console.log('✅ BarcodeDetector disponible con formatos:', availableFormats);
            return true;
        } catch (error) {
            console.log('❌ Error verificando BarcodeDetector:', error);
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
            console.log('🚀 Inicializando BarcodeDetector engine...');

            // Verificar disponibilidad
            if (!(await this.isAvailable())) {
                throw new Error('BarcodeDetector no está disponible');
            }

            // Configurar detector con formatos soportados
            const supportedFormats = await BarcodeDetector.getSupportedFormats();
            const formatsToUse = this.config.preferredFormats.filter(format => 
                supportedFormats.includes(format)
            );

            this.detector = new BarcodeDetector({
                formats: formatsToUse
            });

            // Configurar elemento de video
            this.videoElement = document.getElementById(elementId);
            if (!this.videoElement) {
                throw new Error(`Elemento con ID '${elementId}' no encontrado`);
            }

            // Aplicar estilos básicos al video
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
            this.videoElement.style.objectFit = 'cover';
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;

            console.log('✅ BarcodeDetector engine inicializado correctamente');
            console.log('📋 Formatos configurados:', formatsToUse);
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando BarcodeDetector engine:', error);
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
                console.log('⚠️ El escaneo ya está en progreso');
                return true;
            }

            console.log('▶️ Iniciando escaneo con BarcodeDetector...');

            // Guardar callbacks
            this.scanCallbacks.onSuccess = onSuccess;
            this.scanCallbacks.onError = onError;

            // Obtener acceso a la cámara
            await this._setupCamera();

            // Iniciar bucle de escaneo
            this.isScanning = true;
            this._startScanLoop();

            console.log('✅ Escaneo iniciado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error iniciando escaneo:', error);
            this.isScanning = false;
            
            if (this.scanCallbacks.onError) {
                this.scanCallbacks.onError(error, this._getErrorMessage(error));
            }
            
            throw error;
        }
    }

    /**
     * Configurar acceso a la cámara
     * @private
     */
    async _setupCamera() {
        try {
            // Configuración optimizada para escaneo de códigos
            const constraints = {
                video: {
                    facingMode: 'environment', // Cámara trasera preferible
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 },
                    // Configuraciones adicionales para mejor enfoque
                    focusMode: { ideal: 'continuous' },
                    exposureMode: { ideal: 'continuous' },
                    whiteBalanceMode: { ideal: 'continuous' }
                }
            };

            // Intentar obtener stream con configuración avanzada
            try {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (advancedError) {
                console.log('⚠️ Configuración avanzada no disponible, usando básica...');
                
                // Fallback a configuración básica
                const basicConstraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                
                this.stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
            }

            // Configurar video element
            this.videoElement.srcObject = this.stream;
            
            // Esperar a que el video esté listo
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play()
                        .then(resolve)
                        .catch(reject);
                };
                this.videoElement.onerror = reject;
            });

            console.log('📹 Cámara configurada correctamente');
            console.log('📐 Resolución de video:', this.videoElement.videoWidth, 'x', this.videoElement.videoHeight);
        } catch (error) {
            console.error('❌ Error configurando cámara:', error);
            throw error;
        }
    }

    /**
     * Iniciar bucle de escaneo
     * @private
     */
    _startScanLoop() {
        const scanFrame = async () => {
            if (!this.isScanning || !this.detector || !this.videoElement) {
                return;
            }

            try {
                const startTime = performance.now();
                
                // Detectar códigos en el frame actual
                const barcodes = await this.detector.detect(this.videoElement);
                
                const scanTime = performance.now() - startTime;
                this._updateStats(scanTime, barcodes.length > 0);

                // Si se encontraron códigos
                if (barcodes.length > 0) {
                    console.log('🎯 Código detectado con BarcodeDetector:', barcodes[0]);
                    
                    // Detener escaneo y notificar éxito
                    this.isScanning = false;
                    
                    if (this.scanCallbacks.onSuccess) {
                        this.scanCallbacks.onSuccess(
                            barcodes[0].rawValue, 
                            {
                                format: barcodes[0].format,
                                boundingBox: barcodes[0].boundingBox,
                                cornerPoints: barcodes[0].cornerPoints,
                                engine: 'native',
                                scanTime: scanTime,
                                confidence: 1.0 // BarcodeDetector nativo tiene alta confianza
                            }
                        );
                    }
                    return;
                }

                // Resetear contador de errores consecutivos en escaneo exitoso (aunque sin resultado)
                this.stats.consecutiveErrors = 0;

            } catch (error) {
                console.warn('⚠️ Error en frame de escaneo:', error);
                this.stats.consecutiveErrors++;
                
                // Si hay demasiados errores consecutivos, detener
                if (this.stats.consecutiveErrors >= this.config.errorThreshold) {
                    console.error('❌ Demasiados errores consecutivos, deteniendo escaneo');
                    this.isScanning = false;
                    
                    if (this.scanCallbacks.onError) {
                        this.scanCallbacks.onError(error, 'Demasiados errores en el escaneo');
                    }
                    return;
                }
            }

            // Programar siguiente frame
            if (this.isScanning) {
                this.animationFrame = setTimeout(scanFrame, this.config.scanInterval);
            }
        };

        // Iniciar el primer frame
        scanFrame();
    }

    /**
     * Actualizar estadísticas de rendimiento
     * @private
     */
    _updateStats(scanTime, success) {
        this.stats.scansPerformed++;
        this.stats.lastScanTime = scanTime;
        
        if (success) {
            this.stats.successfulScans++;
        }
        
        // Calcular tiempo promedio (media móvil simple)
        this.stats.averageTime = (this.stats.averageTime * 0.9) + (scanTime * 0.1);
    }

    /**
     * Detener el escaneo
     * @returns {Promise<void>}
     */
    async stop() {
        try {
            console.log('⏹️ Deteniendo escaneo BarcodeDetector...');
            
            this.isScanning = false;

            // Cancelar frame de animación
            if (this.animationFrame) {
                clearTimeout(this.animationFrame);
                this.animationFrame = null;
            }

            // Detener stream de video
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('📹 Track de video detenido');
                });
                this.stream = null;
            }

            // Limpiar elemento de video
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }

            console.log('✅ Escaneo detenido correctamente');
            console.log('📊 Estadísticas finales:', this.stats);
        } catch (error) {
            console.error('⚠️ Error deteniendo escaneo:', error);
        }
    }

    /**
     * Limpiar recursos
     * @returns {Promise<void>}
     */
    async destroy() {
        await this.stop();
        
        this.detector = null;
        this.videoElement = null;
        this.scanCallbacks = { onSuccess: null, onError: null };
        
        // Resetear estadísticas
        this.stats = {
            scansPerformed: 0,
            successfulScans: 0,
            averageTime: 0,
            lastScanTime: 0,
            consecutiveErrors: 0
        };
        
        console.log('🧹 BarcodeDetector engine destruido');
    }

    /**
     * Obtener información del motor
     * @returns {Object}
     */
    getInfo() {
        return {
            name: 'BarcodeDetector (Nativo)',
            type: 'native',
            performance: 'maximum',
            formats: this.config.preferredFormats,
            stats: { ...this.stats },
            isActive: this.isScanning,
            capabilities: {
                realTime: true,
                highAccuracy: true,
                lowLatency: true,
                hardwareAccelerated: true
            }
        };
    }

    /**
     * Obtener mensaje de error amigable
     * @private
     */
    _getErrorMessage(error) {
        if (error.name === 'NotAllowedError') {
            return 'Permisos de cámara denegados. Permite el acceso y recarga la página.';
        } else if (error.name === 'NotFoundError') {
            return 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotReadableError') {
            return 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            return 'La configuración de cámara no es compatible con el dispositivo.';
        }
        
        return `Error del motor nativo: ${error.message}`;
    }

    /**
     * Obtener estadísticas de rendimiento actuales
     * @returns {Object}
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            fps: this.stats.averageTime > 0 ? Math.round(1000 / this.stats.averageTime) : 0,
            successRate: this.stats.scansPerformed > 0 ? 
                (this.stats.successfulScans / this.stats.scansPerformed) * 100 : 0
        };
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeDetectorEngine;
} else if (typeof window !== 'undefined') {
    window.BarcodeDetectorEngine = BarcodeDetectorEngine;
}