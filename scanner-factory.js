/**
 * Scanner Factory - Orquestador inteligente de motores de escaneo
 * Versión: 2.1.0 - Selección automática, fallbacks y analytics mejoradas
 * 
 * Este es el cerebro del sistema híbrido que:
 * 1. Detecta capacidades del navegador
 * 2. Selecciona el motor óptimo automáticamente
 * 3. Gestiona fallbacks transparentes en caso de errores
 * 4. Proporciona una interfaz unificada para el ScannerModule
 * 5. Recopila métricas detalladas para optimización
 */

class ScannerFactory {
    constructor() {
        this.capabilityDetector = null;
        this.currentEngine = null;
        this.currentEngineType = null;
        this.isInitialized = false;
        this.engineInstances = new Map();
        
        // Configuración de la factory
        this.config = {
            // Orden de prioridad de motores (del más rápido al más compatible)
            enginePriority: ['native', 'wasm', 'javascript'],
            
            // Configuración específica por motor
            engineConfigs: {
                native: {
                    maxRetries: 2,
                    timeout: 5000,
                    priority: 1
                },
                wasm: {
                    maxRetries: 3,
                    timeout: 10000,
                    priority: 2
                },
                javascript: {
                    maxRetries: 5,
                    timeout: 15000,
                    priority: 3
                }
            },
            
            // Configuración de fallbacks
            fallbackEnabled: true,
            maxFallbackAttempts: 2,
            fallbackDelay: 1000, // ms entre intentos de fallback
            
            // Configuración de caché de motor preferido
            cacheEnginePreference: true,
            preferenceStorageKey: 'mega_scan_preferred_engine',
            
            // Analytics y métricas
            analyticsEnabled: true,
            metricsRetentionDays: 7,
            performanceThresholds: {
                initTime: 3000, // ms
                scanTime: 1000, // ms
                fallbackRate: 20 // %
            }
        };

        // Estadísticas mejoradas con analytics
        this.stats = {
            totalScans: 0,
            successfulScans: 0,
            failedScans: 0,
            fallbacksUsed: 0,
            enginesUsed: {
                native: 0,
                wasm: 0,
                javascript: 0
            },
            averageInitTime: 0,
            lastEngineUsed: null,
            sessionStartTime: Date.now(),
            
            // Nuevas métricas de analytics
            performance: {
                averageScanTime: 0,
                fastestScan: Infinity,
                slowestScan: 0,
                scanTimeHistory: []
            },
            reliability: {
                consecutiveFailures: 0,
                maxConsecutiveFailures: 0,
                errorsByType: {},
                lastErrors: []
            },
            compatibility: {
                browserInfo: this._getBrowserInfo(),
                deviceInfo: null, // Se llenará durante la inicialización
                supportedEngines: [],
                recommendedEngine: null
            },
            usage: {
                sessionsCount: this._getSessionCount(),
                totalUsageTime: 0,
                averageSessionDuration: 0,
                preferredEngine: this._getCachedEnginePreference()
            }
        };

        this.callbacks = {
            onEngineSelected: null,
            onFallbackUsed: null,
            onScanSuccess: null,
            onScanError: null,
            onStatusUpdate: null,
            onAnalyticsUpdate: null // Nuevo callback para analytics
        };

        // Inicializar analytics al crear la instancia
        this._initializeAnalytics();
    }

    /**
     * Inicializar sistema de analytics
     * @private
     */
    _initializeAnalytics() {
        if (!this.config.analyticsEnabled) return;

        try {
            // Incrementar contador de sesiones
            this._incrementSessionCount();
            
            // Cargar métricas históricas
            this._loadHistoricalMetrics();
            
            // Configurar limpieza automática de métricas antiguas
            this._setupMetricsCleanup();
            
            console.log('📊 Analytics inicializadas correctamente');
        } catch (error) {
            console.warn('⚠️ Error inicializando analytics:', error);
        }
    }

    /**
     * Obtener información del navegador para analytics
     * @private
     */
    _getBrowserInfo() {
        const ua = navigator.userAgent;
        return {
            name: this._getBrowserName(ua),
            version: this._getBrowserVersion(ua),
            engine: this._getEngineFromUA(ua),
            platform: navigator.platform,
            language: navigator.language,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    /**
     * Obtener nombre del navegador
     * @private
     */
    _getBrowserName(ua) {
        if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    /**
     * Obtener versión del navegador
     * @private
     */
    _getBrowserVersion(ua) {
        const matches = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
        return matches ? matches[2] : 'Unknown';
    }

    /**
     * Obtener motor del navegador
     * @private
     */
    _getEngineFromUA(ua) {
        if (ua.includes('Blink') || ua.includes('Chrome')) return 'Blink';
        if (ua.includes('Gecko') && ua.includes('Firefox')) return 'Gecko';
        if (ua.includes('WebKit')) return 'WebKit';
        return 'Unknown';
    }

    /**
     * Cargar métricas históricas
     * @private
     */
    _loadHistoricalMetrics() {
        try {
            const stored = localStorage.getItem('mega_scan_metrics');
            if (stored) {
                const historical = JSON.parse(stored);
                
                // Fusionar con métricas actuales
                this.stats.usage.totalUsageTime = historical.totalUsageTime || 0;
                this.stats.usage.averageSessionDuration = historical.averageSessionDuration || 0;
                this.stats.performance.scanTimeHistory = historical.scanTimeHistory || [];
                
                // Limpiar datos antiguos
                this._cleanOldMetrics(historical);
                
                console.log('📈 Métricas históricas cargadas');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando métricas históricas:', error);
        }
    }

    /**
     * Guardar métricas actuales
     * @private
     */
    _saveMetrics() {
        if (!this.config.analyticsEnabled) return;

        try {
            const metricsToSave = {
                totalUsageTime: this.stats.usage.totalUsageTime,
                averageSessionDuration: this.stats.usage.averageSessionDuration,
                scanTimeHistory: this.stats.performance.scanTimeHistory.slice(-100), // Últimos 100 escaneos
                timestamp: Date.now(),
                version: '2.1.0'
            };

            localStorage.setItem('mega_scan_metrics', JSON.stringify(metricsToSave));
        } catch (error) {
            console.warn('⚠️ Error guardando métricas:', error);
        }
    }

    /**
     * Configurar limpieza automática de métricas
     * @private
     */
    _setupMetricsCleanup() {
        // Limpiar al cerrar la página
        window.addEventListener('beforeunload', () => {
            this._saveMetrics();
        });

        // Limpiar cada hora
        setInterval(() => {
            this._cleanOldMetrics();
        }, 3600000); // 1 hora
    }

    /**
     * Limpiar métricas antiguas
     * @private
     */
    _cleanOldMetrics(metrics = null) {
        const cutoffTime = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
        
        // Limpiar historial de tiempos de escaneo
        this.stats.performance.scanTimeHistory = this.stats.performance.scanTimeHistory.filter(
            record => record.timestamp > cutoffTime
        );

        // Limpiar errores antiguos
        this.stats.reliability.lastErrors = this.stats.reliability.lastErrors.filter(
            error => error.timestamp > cutoffTime
        );
    }

    /**
     * Incrementar contador de sesiones
     * @private
     */
    _incrementSessionCount() {
        try {
            const current = parseInt(localStorage.getItem('mega_scan_sessions') || '0');
            localStorage.setItem('mega_scan_sessions', (current + 1).toString());
            this.stats.usage.sessionsCount = current + 1;
        } catch (error) {
            this.stats.usage.sessionsCount = 1;
        }
    }

    /**
     * Obtener contador de sesiones
     * @private
     */
    _getSessionCount() {
        try {
            return parseInt(localStorage.getItem('mega_scan_sessions') || '0');
        } catch (error) {
            return 0;
        }
    }

    /**
     * Inicializar la factory
     * @returns {Promise<boolean>}
     */
    async initialize() {
        try {
            console.log('🭠 Inicializando Scanner Factory con analytics...');
            const initStart = performance.now();

            // Crear detector de capacidades
            this.capabilityDetector = new ScannerCapabilityDetector();
            
            // Detectar capacidades del navegador
            await this.capabilityDetector.detectCapabilities();
            
            // Almacenar información del dispositivo para analytics
            this.stats.compatibility.deviceInfo = this._getDeviceInfo();
            
            // Determinar motor recomendado
            const recommendedEngine = await this.capabilityDetector.getRecommendedEngine();
            this.stats.compatibility.recommendedEngine = recommendedEngine;
            console.log(`🎯 Motor recomendado por detector: ${recommendedEngine}`);

            // Obtener motores soportados para analytics
            this.stats.compatibility.supportedEngines = await this._detectSupportedEngines();

            // Verificar preferencia cacheada
            const cachedPreference = this._getCachedEnginePreference();
            if (cachedPreference && await this._isEngineAvailable(cachedPreference)) {
                console.log(`💾 Usando motor cacheado: ${cachedPreference}`);
                this.currentEngineType = cachedPreference;
            } else {
                this.currentEngineType = recommendedEngine;
            }

            const initTime = performance.now() - initStart;
            this.stats.averageInitTime = initTime;
            this.isInitialized = true;

            // Registrar métricas de inicialización
            this._recordInitializationMetrics(initTime, recommendedEngine);

            console.log(`✅ Scanner Factory inicializada en ${initTime.toFixed(1)}ms`);
            console.log(`🔧 Motor seleccionado: ${this.currentEngineType}`);
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Scanner Factory:', error);
            this._recordError('initialization', error);
            throw error;
        }
    }

    /**
     * Obtener información del dispositivo para analytics
     * @private
     */
    _getDeviceInfo() {
        const screen = window.screen;
        return {
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            touch: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }

    /**
     * Detectar motores soportados
     * @private
     */
    async _detectSupportedEngines() {
        const supported = [];
        
        for (const engineType of this.config.enginePriority) {
            if (await this._isEngineAvailable(engineType)) {
                supported.push(engineType);
            }
        }
        
        return supported;
    }

    /**
     * Registrar métricas de inicialización
     * @private
     */
    _recordInitializationMetrics(initTime, recommendedEngine) {
        const metrics = {
            initTime,
            recommendedEngine,
            browserInfo: this.stats.compatibility.browserInfo,
            deviceInfo: this.stats.compatibility.deviceInfo,
            supportedEngines: this.stats.compatibility.supportedEngines,
            timestamp: Date.now()
        };

        // Verificar si el tiempo de inicialización es problemático
        if (initTime > this.config.performanceThresholds.initTime) {
            console.warn(`⚠️ Inicialización lenta: ${initTime.toFixed(1)}ms (threshold: ${this.config.performanceThresholds.initTime}ms)`);
            this._recordPerformanceIssue('slow_init', { initTime, threshold: this.config.performanceThresholds.initTime });
        }

        // Notificar analytics si hay callback
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('initialization', metrics);
        }
    }

    /**
     * Registrar problema de rendimiento
     * @private
     */
    _recordPerformanceIssue(type, data) {
        console.log(`🐌 Problema de rendimiento detectado: ${type}`, data);
        
        // Aquí se podría enviar a un servicio de analytics externo
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('performance_issue', { type, data, timestamp: Date.now() });
        }
    }

    /**
     * Obtener motor de escaneo configurado y listo
     * @param {string} elementId - ID del elemento DOM para el video
     * @param {Object} config - Configuración adicional
     * @returns {Promise<IScannerEngine>}
     */
    async getEngine(elementId, config = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log(`🔧 Obteniendo motor: ${this.currentEngineType}`);
            this._updateStatus(`Preparando motor ${this.currentEngineType}...`);

            const engineStart = performance.now();

            // Intentar crear/obtener motor actual
            let engine = await this._createEngine(this.currentEngineType);
            
            // Intentar inicializar el motor
            try {
                const success = await engine.initialize(elementId, config);
                if (success) {
                    const engineTime = performance.now() - engineStart;
                    
                    this.currentEngine = engine;
                    this.stats.enginesUsed[this.currentEngineType]++;
                    this.stats.lastEngineUsed = this.currentEngineType;
                    
                    // Cachear preferencia exitosa
                    this._setCachedEnginePreference(this.currentEngineType);
                    
                    // Registrar métricas de motor
                    this._recordEngineMetrics(this.currentEngineType, engineTime, true);
                    
                    if (this.callbacks.onEngineSelected) {
                        this.callbacks.onEngineSelected(this.currentEngineType, engine.getInfo());
                    }
                    
                    console.log(`✅ Motor ${this.currentEngineType} listo para usar`);
                    this._updateStatus(`Motor ${this.currentEngineType} listo`);
                    
                    return engine;
                }
            } catch (engineError) {
                console.warn(`⚠️ Error inicializando motor ${this.currentEngineType}:`, engineError);
                
                // Registrar métricas de fallo
                this._recordEngineMetrics(this.currentEngineType, performance.now() - engineStart, false, engineError);
                
                // Intentar fallback si está habilitado
                if (this.config.fallbackEnabled) {
                    return await this._attemptFallback(elementId, config, engineError);
                } else {
                    throw engineError;
                }
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo motor de escaneo:', error);
            this.stats.failedScans++;
            this._recordError('engine_creation', error);
            throw error;
        }
    }

    /**
     * Registrar métricas de motor
     * @private
     */
    _recordEngineMetrics(engineType, initTime, success, error = null) {
        const metrics = {
            engineType,
            initTime,
            success,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 500) // Truncado
            } : null,
            timestamp: Date.now()
        };

        if (success) {
            console.log(`📊 Motor ${engineType} inicializado en ${initTime.toFixed(1)}ms`);
        } else {
            console.log(`📊 Motor ${engineType} falló después de ${initTime.toFixed(1)}ms`);
            this._recordError('engine_init', error);
        }

        // Verificar thresholds de rendimiento
        if (success && initTime > this.config.performanceThresholds.initTime) {
            this._recordPerformanceIssue('slow_engine_init', { engineType, initTime });
        }

        // Notificar analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('engine_metrics', metrics);
        }
    }

    /**
     * Crear instancia de motor específico
     * @private
     */
    async _createEngine(engineType) {
        // Verificar si ya tenemos una instancia cacheada
        if (this.engineInstances.has(engineType)) {
            const cachedEngine = this.engineInstances.get(engineType);
            console.log(`💾 Reutilizando instancia cacheada: ${engineType}`);
            return cachedEngine;
        }

        console.log(`🔨 Creando nueva instancia: ${engineType}`);
        let engine = null;

        switch (engineType) {
            case 'native':
                if (typeof BarcodeDetectorEngine === 'undefined') {
                    throw new Error('BarcodeDetectorEngine no disponible');
                }
                engine = new BarcodeDetectorEngine();
                break;
                
            case 'wasm':
                if (typeof ZXingWASMEngine === 'undefined') {
                    throw new Error('ZXingWASMEngine no disponible');
                }
                engine = new ZXingWASMEngine();
                break;
                
            case 'javascript':
                if (typeof HTML5QRCodeEngine === 'undefined') {
                    throw new Error('HTML5QRCodeEngine no disponible');
                }
                engine = new HTML5QRCodeEngine();
                break;
                
            default:
                throw new Error(`Tipo de motor desconocido: ${engineType}`);
        }

        // Verificar que el motor esté disponible
        const isAvailable = await engine.isAvailable();
        if (!isAvailable) {
            throw new Error(`Motor ${engineType} no está disponible en este navegador`);
        }

        // Cachear instancia para reutilización
        this.engineInstances.set(engineType, engine);
        console.log(`✅ Motor ${engineType} creado y cacheado`);
        
        return engine;
    }

    /**
     * Intentar fallback a siguiente motor disponible
     * @private
     */
    async _attemptFallback(elementId, config, originalError) {
        console.log('🔄 Iniciando secuencia de fallback...');
        this.stats.fallbacksUsed++;
        
        const fallbackStart = performance.now();
        
        if (this.callbacks.onFallbackUsed) {
            this.callbacks.onFallbackUsed(this.currentEngineType, originalError);
        }

        // Obtener siguiente motor en orden de prioridad
        const currentIndex = this.config.enginePriority.indexOf(this.currentEngineType);
        const remainingEngines = this.config.enginePriority.slice(currentIndex + 1);

        for (const fallbackEngine of remainingEngines) {
            try {
                console.log(`🔄 Intentando fallback a: ${fallbackEngine}`);
                this._updateStatus(`Intentando motor alternativo: ${fallbackEngine}...`);
                
                // Verificar disponibilidad antes de intentar
                if (!(await this._isEngineAvailable(fallbackEngine))) {
                    console.log(`⭕ Motor ${fallbackEngine} no disponible, saltando...`);
                    continue;
                }

                // Delay opcional entre intentos
                if (this.config.fallbackDelay > 0) {
                    await this._delay(this.config.fallbackDelay);
                }

                // Intentar crear y configurar motor de fallback
                const fallbackEngineInstance = await this._createEngine(fallbackEngine);
                const success = await fallbackEngineInstance.initialize(elementId, config);
                
                if (success) {
                    const fallbackTime = performance.now() - fallbackStart;
                    
                    // Actualizar motor actual
                    this.currentEngineType = fallbackEngine;
                    this.currentEngine = fallbackEngineInstance;
                    this.stats.enginesUsed[fallbackEngine]++;
                    this.stats.lastEngineUsed = fallbackEngine;
                    
                    // Actualizar preferencia cacheada
                    this._setCachedEnginePreference(fallbackEngine);
                    
                    // Registrar métricas de fallback exitoso
                    this._recordFallbackMetrics(fallbackEngine, fallbackTime, true, originalError);
                    
                    console.log(`✅ Fallback exitoso a motor: ${fallbackEngine}`);
                    this._updateStatus(`Motor alternativo ${fallbackEngine} listo`);
                    
                    if (this.callbacks.onEngineSelected) {
                        this.callbacks.onEngineSelected(fallbackEngine, fallbackEngineInstance.getInfo());
                    }
                    
                    return fallbackEngineInstance;
                }
                
            } catch (fallbackError) {
                console.warn(`⚠️ Fallback a ${fallbackEngine} falló:`, fallbackError);
                this._recordError('fallback', fallbackError);
                continue;
            }
        }

        // Si llegamos aquí, todos los fallbacks fallaron
        const fallbackTime = performance.now() - fallbackStart;
        this._recordFallbackMetrics(null, fallbackTime, false, originalError);
        
        const finalError = new Error(`Todos los motores de escaneo fallaron. Error original: ${originalError.message}`);
        console.error('❌ Todos los fallbacks agotados:', finalError);
        this.stats.failedScans++;
        this._recordError('all_engines_failed', finalError);
        throw finalError;
    }

    /**
     * Registrar métricas de fallback
     * @private
     */
    _recordFallbackMetrics(successfulEngine, fallbackTime, success, originalError) {
        const metrics = {
            originalEngine: this.currentEngineType,
            successfulEngine,
            fallbackTime,
            success,
            originalError: {
                name: originalError.name,
                message: originalError.message
            },
            timestamp: Date.now()
        };

        if (success) {
            console.log(`📊 Fallback exitoso a ${successfulEngine} en ${fallbackTime.toFixed(1)}ms`);
        } else {
            console.log(`📊 Fallback falló después de ${fallbackTime.toFixed(1)}ms`);
            this._recordPerformanceIssue('fallback_failure', metrics);
        }

        // Verificar tasa de fallback
        const fallbackRate = (this.stats.fallbacksUsed / this.stats.totalScans) * 100;
        if (fallbackRate > this.config.performanceThresholds.fallbackRate) {
            this._recordPerformanceIssue('high_fallback_rate', { rate: fallbackRate, threshold: this.config.performanceThresholds.fallbackRate });
        }

        // Notificar analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('fallback_metrics', metrics);
        }
    }

    /**
     * Registrar error para analytics
     * @private
     */
    _recordError(type, error) {
        const errorRecord = {
            type,
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 1000), // Truncado
            timestamp: Date.now(),
            engine: this.currentEngineType,
            browserInfo: this.stats.compatibility.browserInfo
        };

        // Añadir a historial de errores
        this.stats.reliability.lastErrors.push(errorRecord);
        
        // Mantener solo los últimos 50 errores
        if (this.stats.reliability.lastErrors.length > 50) {
            this.stats.reliability.lastErrors = this.stats.reliability.lastErrors.slice(-50);
        }

        // Actualizar contadores por tipo
        this.stats.reliability.errorsByType[type] = (this.stats.reliability.errorsByType[type] || 0) + 1;

        // Actualizar errores consecutivos
        this.stats.reliability.consecutiveFailures++;
        this.stats.reliability.maxConsecutiveFailures = Math.max(
            this.stats.reliability.maxConsecutiveFailures,
            this.stats.reliability.consecutiveFailures
        );

        console.log(`📊 Error registrado: ${type} - ${error.message}`);

        // Notificar analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('error', errorRecord);
        }
    }

    /**
     * Verificar si un motor específico está disponible
     * @private
     */
    async _isEngineAvailable(engineType) {
        try {
            const engine = await this._createEngine(engineType);
            return await engine.isAvailable();
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtener información del motor actual
     * @returns {Object|null}
     */
    getCurrentEngineInfo() {
        if (!this.currentEngine) {
            return null;
        }
        
        return {
            ...this.currentEngine.getInfo(),
            isRecommended: this.currentEngineType === 'native', // BarcodeDetector es siempre el recomendado
            fallbacksAvailable: this._getAvailableFallbacks(),
            factoryStats: this.getStats()
        };
    }

    /**
     * Obtener motores de fallback disponibles
     * @private
     */
    _getAvailableFallbacks() {
        const currentIndex = this.config.enginePriority.indexOf(this.currentEngineType);
        return this.config.enginePriority.slice(currentIndex + 1);
    }

    /**
     * Configurar callbacks de la factory
     * @param {Object} callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Obtener estadísticas de la factory (mejoradas con analytics)
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalScans > 0 ? 
                (this.stats.successfulScans / this.stats.totalScans) * 100 : 0,
            fallbackRate: this.stats.totalScans > 0 ? 
                (this.stats.fallbacksUsed / this.stats.totalScans) * 100 : 0,
            sessionDuration: Date.now() - this.stats.sessionStartTime,
            mostUsedEngine: this._getMostUsedEngine(),
            capabilities: this.capabilityDetector?.getCapabilities() || null,
            
            // Nuevas métricas calculadas
            reliability: {
                ...this.stats.reliability,
                errorRate: this.stats.totalScans > 0 ? 
                    (this.stats.failedScans / this.stats.totalScans) * 100 : 0,
                averageErrorsPerSession: this.stats.usage.sessionsCount > 0 ?
                    this.stats.failedScans / this.stats.usage.sessionsCount : 0
            },
            performance: {
                ...this.stats.performance,
                scanTimePercentiles: this._calculateScanTimePercentiles()
            }
        };
    }

    /**
     * Calcular percentiles de tiempo de escaneo
     * @private
     */
    _calculateScanTimePercentiles() {
        const times = this.stats.performance.scanTimeHistory.map(record => record.scanTime).sort((a, b) => a - b);
        
        if (times.length === 0) return null;

        return {
            p50: this._getPercentile(times, 50),
            p90: this._getPercentile(times, 90),
            p95: this._getPercentile(times, 95),
            p99: this._getPercentile(times, 99)
        };
    }

    /**
     * Calcular percentil
     * @private
     */
    _getPercentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }

    /**
     * Obtener motor más usado en la sesión
     * @private
     */
    _getMostUsedEngine() {
        const engines = this.stats.enginesUsed;
        return Object.keys(engines).reduce((a, b) => 
            engines[a] > engines[b] ? a : b, 'none'
        );
    }

    /**
     * Registrar escaneo exitoso (mejorado con analytics)
     */
    recordScanSuccess(scanTime = 0) {
        this.stats.totalScans++;
        this.stats.successfulScans++;
        this.stats.reliability.consecutiveFailures = 0; // Resetear fallos consecutivos
        
        // Registrar métricas de rendimiento del escaneo
        if (scanTime > 0) {
            this.stats.performance.averageScanTime = this.stats.performance.averageScanTime === 0 ? 
                scanTime : (this.stats.performance.averageScanTime * 0.9 + scanTime * 0.1);
            
            this.stats.performance.fastestScan = Math.min(this.stats.performance.fastestScan, scanTime);
            this.stats.performance.slowestScan = Math.max(this.stats.performance.slowestScan, scanTime);
            
            // Añadir al historial
            this.stats.performance.scanTimeHistory.push({
                scanTime,
                engine: this.currentEngineType,
                timestamp: Date.now()
            });
            
            // Verificar si el escaneo fue lento
            if (scanTime > this.config.performanceThresholds.scanTime) {
                this._recordPerformanceIssue('slow_scan', { 
                    scanTime, 
                    engine: this.currentEngineType,
                    threshold: this.config.performanceThresholds.scanTime 
                });
            }
            
            console.log(`📊 Escaneo exitoso en ${scanTime.toFixed(1)}ms con motor ${this.currentEngineType}`);
        }

        // Notificar analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('scan_success', {
                scanTime,
                engine: this.currentEngineType,
                totalScans: this.stats.totalScans,
                successRate: (this.stats.successfulScans / this.stats.totalScans) * 100,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Registrar escaneo fallido (mejorado con analytics)
     */
    recordScanFailure(error = null) {
        this.stats.totalScans++;
        this.stats.failedScans++;
        
        if (error) {
            this._recordError('scan_failure', error);
        }

        console.log(`📊 Escaneo fallido. Total fallos: ${this.stats.failedScans}`);

        // Notificar analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('scan_failure', {
                engine: this.currentEngineType,
                totalScans: this.stats.totalScans,
                failureRate: (this.stats.failedScans / this.stats.totalScans) * 100,
                consecutiveFailures: this.stats.reliability.consecutiveFailures,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Limpiar recursos de todos los motores
     * @returns {Promise<void>}
     */
    async destroy() {
        try {
            console.log('🧹 Destruyendo Scanner Factory...');
            
            // Calcular duración de sesión para analytics
            const sessionDuration = Date.now() - this.stats.sessionStartTime;
            this.stats.usage.totalUsageTime += sessionDuration;
            
            // Calcular duración promedio de sesión
            if (this.stats.usage.sessionsCount > 0) {
                this.stats.usage.averageSessionDuration = this.stats.usage.totalUsageTime / this.stats.usage.sessionsCount;
            }

            // Guardar métricas finales
            this._saveMetrics();

            // Notificar fin de sesión a analytics
            if (this.callbacks.onAnalyticsUpdate) {
                this.callbacks.onAnalyticsUpdate('session_end', {
                    sessionDuration,
                    totalScans: this.stats.totalScans,
                    successfulScans: this.stats.successfulScans,
                    enginesUsed: this.stats.enginesUsed,
                    fallbacksUsed: this.stats.fallbacksUsed,
                    timestamp: Date.now()
                });
            }
            
            // Destruir motor actual
            if (this.currentEngine) {
                await this.currentEngine.destroy();
            }
            
            // Destruir todas las instancias cacheadas
            for (const [engineType, engine] of this.engineInstances) {
                try {
                    await engine.destroy();
                    console.log(`🧹 Motor ${engineType} destruido`);
                } catch (error) {
                    console.warn(`⚠️ Error destruyendo motor ${engineType}:`, error);
                }
            }
            
            // Limpiar referencias
            this.engineInstances.clear();
            this.currentEngine = null;
            this.currentEngineType = null;
            this.capabilityDetector = null;
            this.isInitialized = false;
            this.callbacks = {};
            
            console.log('✅ Scanner Factory destruida completamente');
            console.log('📊 Métricas finales guardadas');
            
        } catch (error) {
            console.error('⚠️ Error destruyendo Scanner Factory:', error);
        }
    }

    /**
     * Actualizar estado y notificar
     * @private
     */
    _updateStatus(message) {
        console.log('📊 Factory Status:', message);
        
        if (this.callbacks.onStatusUpdate) {
            this.callbacks.onStatusUpdate(message);
        }
    }

    /**
     * Obtener preferencia de motor cacheada
     * @private
     */
    _getCachedEnginePreference() {
        if (!this.config.cacheEnginePreference) {
            return null;
        }
        
        try {
            return localStorage.getItem(this.config.preferenceStorageKey);
        } catch (error) {
            console.warn('⚠️ Error leyendo preferencia cacheada:', error);
            return null;
        }
    }

    /**
     * Guardar preferencia de motor en caché
     * @private
     */
    _setCachedEnginePreference(engineType) {
        if (!this.config.cacheEnginePreference) {
            return;
        }
        
        try {
            localStorage.setItem(this.config.preferenceStorageKey, engineType);
            console.log(`💾 Preferencia de motor cacheada: ${engineType}`);
        } catch (error) {
            console.warn('⚠️ Error guardando preferencia de motor:', error);
        }
    }

    /**
     * Delay helper para fallbacks
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Resetear estadísticas de la sesión
     */
    resetStats() {
        const oldStats = { ...this.stats };
        
        this.stats = {
            totalScans: 0,
            successfulScans: 0,
            failedScans: 0,
            fallbacksUsed: 0,
            enginesUsed: {
                native: 0,
                wasm: 0,
                javascript: 0
            },
            averageInitTime: this.stats.averageInitTime, // Mantener tiempo de inicialización
            lastEngineUsed: this.stats.lastEngineUsed,   // Mantener último motor usado
            sessionStartTime: Date.now(),
            
            // Resetear métricas de analytics pero mantener históricas
            performance: {
                averageScanTime: 0,
                fastestScan: Infinity,
                slowestScan: 0,
                scanTimeHistory: this.stats.performance.scanTimeHistory // Mantener historial
            },
            reliability: {
                consecutiveFailures: 0,
                maxConsecutiveFailures: this.stats.reliability.maxConsecutiveFailures,
                errorsByType: {},
                lastErrors: this.stats.reliability.lastErrors.slice(-10) // Mantener últimos 10 errores
            },
            compatibility: this.stats.compatibility, // Mantener info de compatibilidad
            usage: {
                ...this.stats.usage,
                sessionsCount: this.stats.usage.sessionsCount + 1 // Incrementar sesiones
            }
        };
        
        console.log('📊 Estadísticas de Scanner Factory reseteadas');
        
        // Notificar reset a analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('stats_reset', {
                oldStats: {
                    totalScans: oldStats.totalScans,
                    successRate: oldStats.totalScans > 0 ? (oldStats.successfulScans / oldStats.totalScans) * 100 : 0,
                    fallbackRate: oldStats.totalScans > 0 ? (oldStats.fallbacksUsed / oldStats.totalScans) * 100 : 0
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Forzar motor específico (para debugging/testing)
     * @param {string} engineType - Tipo de motor a forzar
     */
    forceEngine(engineType) {
        if (!this.config.enginePriority.includes(engineType)) {
            throw new Error(`Motor desconocido: ${engineType}`);
        }
        
        const previousEngine = this.currentEngineType;
        this.currentEngineType = engineType;
        
        console.log(`🔧 Motor forzado de ${previousEngine} a: ${engineType}`);
        
        // Registrar cambio forzado en analytics
        if (this.callbacks.onAnalyticsUpdate) {
            this.callbacks.onAnalyticsUpdate('engine_forced', {
                from: previousEngine,
                to: engineType,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Obtener lista de motores disponibles en el navegador actual
     * @returns {Promise<Array>}
     */
    async getAvailableEngines() {
        const available = [];
        
        for (const engineType of this.config.enginePriority) {
            if (await this._isEngineAvailable(engineType)) {
                available.push(engineType);
            }
        }
        
        return available;
    }

    /**
     * Generar reporte detallado de analytics
     * @returns {Object}
     */
    getAnalyticsReport() {
        const stats = this.getStats();
        
        return {
            summary: {
                version: '2.1.0',
                generatedAt: new Date().toISOString(),
                sessionDuration: stats.sessionDuration,
                totalScans: stats.totalScans,
                successRate: stats.successRate,
                fallbackRate: stats.fallbackRate
            },
            performance: {
                averageInitTime: stats.averageInitTime,
                averageScanTime: stats.performance.averageScanTime,
                fastestScan: stats.performance.fastestScan,
                slowestScan: stats.performance.slowestScan,
                scanTimePercentiles: stats.performance.scanTimePercentiles
            },
            reliability: {
                errorRate: stats.reliability.errorRate,
                consecutiveFailures: stats.reliability.consecutiveFailures,
                maxConsecutiveFailures: stats.reliability.maxConsecutiveFailures,
                errorsByType: stats.reliability.errorsByType,
                recentErrors: stats.reliability.lastErrors.slice(-5) // Últimos 5 errores
            },
            usage: {
                sessionsCount: stats.usage.sessionsCount,
                totalUsageTime: stats.usage.totalUsageTime,
                averageSessionDuration: stats.usage.averageSessionDuration,
                preferredEngine: stats.usage.preferredEngine,
                mostUsedEngine: stats.mostUsedEngine,
                enginesUsed: stats.enginesUsed
            },
            compatibility: {
                browserInfo: stats.compatibility.browserInfo,
                deviceInfo: stats.compatibility.deviceInfo,
                supportedEngines: stats.compatibility.supportedEngines,
                recommendedEngine: stats.compatibility.recommendedEngine,
                capabilities: stats.capabilities
            },
            recommendations: this._generateRecommendations(stats)
        };
    }

    /**
     * Generar recomendaciones basadas en analytics
     * @private
     */
    _generateRecommendations(stats) {
        const recommendations = [];

        // Recomendaciones de rendimiento
        if (stats.averageInitTime > this.config.performanceThresholds.initTime) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: `Tiempo de inicialización lento (${stats.averageInitTime.toFixed(1)}ms). Considerar pre-carga de motores.`
            });
        }

        if (stats.fallbackRate > this.config.performanceThresholds.fallbackRate) {
            recommendations.push({
                type: 'reliability',
                priority: 'medium',
                message: `Alta tasa de fallback (${stats.fallbackRate.toFixed(1)}%). Verificar compatibilidad del motor principal.`
            });
        }

        // Recomendaciones de compatibilidad
        if (stats.compatibility.supportedEngines.length === 1) {
            recommendations.push({
                type: 'compatibility',
                priority: 'low',
                message: 'Solo un motor disponible. Considerar actualizar navegador para mejor rendimiento.'
            });
        }

        // Recomendaciones basadas en errores
        const errorRate = stats.reliability.errorRate;
        if (errorRate > 10) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                message: `Alta tasa de errores (${errorRate.toFixed(1)}%). Revisar configuración de cámara y permisos.`
            });
        }

        return recommendations;
    }

    /**
     * Exportar métricas para análisis externo
     * @returns {Object}
     */
    exportMetrics() {
        return {
            timestamp: Date.now(),
            version: '2.1.0',
            metrics: this.getStats(),
            rawData: {
                scanTimeHistory: this.stats.performance.scanTimeHistory,
                errorHistory: this.stats.reliability.lastErrors,
                compatibility: this.stats.compatibility
            }
        };
    }
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScannerFactory;
} else if (typeof window !== 'undefined') {
    window.ScannerFactory = ScannerFactory;
}