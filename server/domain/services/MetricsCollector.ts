/**
 * Sistema de coleta de métricas seguindo Observer Pattern
 * Implementa Single Responsibility Principle e Open/Closed Principle
 * 
 * Complexidade de coleta: O(1)
 * Complexidade de notificação: O(n) onde n é o número de observadores
 */
export interface IMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

export interface IMetricsObserver {
  onMetricCollected(metric: IMetric): void;
}

export interface IMetricsCollector {
  collectMetric(metric: IMetric): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void;
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
  addObserver(observer: IMetricsObserver): void;
  removeObserver(observer: IMetricsObserver): void;
}

/**
 * Implementação do coletor de métricas usando Observer Pattern
 */
export class MetricsCollector implements IMetricsCollector {
  private observers: Set<IMetricsObserver> = new Set();
  private counters: Map<string, number> = new Map();
  
  /**
   * Coleta uma métrica e notifica observadores
   * Complexidade: O(n) onde n é o número de observadores
   */
  collectMetric(metric: IMetric): void {
    // Validação da métrica
    this.validateMetric(metric);
    
    // Notifica todos os observadores
    this.observers.forEach(observer => {
      try {
        observer.onMetricCollected(metric);
      } catch (error) {
        console.error('Error notifying metrics observer:', error);
      }
    });
  }
  
  /**
   * Incrementa um contador
   * Complexidade: O(1) para incremento + O(n) para notificação
   */
  incrementCounter(name: string, tags?: Record<string, string>): void {
    const key = this.buildMetricKey(name, tags);
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + 1;
    
    this.counters.set(key, newValue);
    
    this.collectMetric({
      name,
      value: newValue,
      timestamp: new Date(),
      tags,
      unit: 'count'
    });
  }
  
  /**
   * Registra tempo de execução
   * Complexidade: O(1) + O(n) para notificação
   */
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    this.collectMetric({
      name,
      value: duration,
      timestamp: new Date(),
      tags,
      unit: 'milliseconds'
    });
  }
  
  /**
   * Registra valor de gauge (medição instantânea)
   * Complexidade: O(1) + O(n) para notificação
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.collectMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      unit: 'gauge'
    });
  }
  
  /**
   * Adiciona observador
   * Complexidade: O(1)
   */
  addObserver(observer: IMetricsObserver): void {
    this.observers.add(observer);
  }
  
  /**
   * Remove observador
   * Complexidade: O(1)
   */
  removeObserver(observer: IMetricsObserver): void {
    this.observers.delete(observer);
  }
  
  /**
   * Obtém valor atual de um contador
   */
  getCounterValue(name: string, tags?: Record<string, string>): number {
    const key = this.buildMetricKey(name, tags);
    return this.counters.get(key) || 0;
  }
  
  /**
   * Reseta um contador
   */
  resetCounter(name: string, tags?: Record<string, string>): void {
    const key = this.buildMetricKey(name, tags);
    this.counters.delete(key);
  }
  
  /**
   * Obtém estatísticas dos observadores
   */
  getObserverCount(): number {
    return this.observers.size;
  }
  
  /**
   * Valida métrica
   */
  private validateMetric(metric: IMetric): void {
    if (!metric.name || metric.name.trim().length === 0) {
      throw new Error('Metric name is required');
    }
    
    if (typeof metric.value !== 'number' || isNaN(metric.value)) {
      throw new Error('Metric value must be a valid number');
    }
    
    if (!metric.timestamp || !(metric.timestamp instanceof Date)) {
      throw new Error('Metric timestamp must be a valid Date');
    }
  }
  
  /**
   * Constrói chave única para métrica com tags
   */
  private buildMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const sortedTags = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}[${sortedTags}]`;
  }
}

/**
 * Observador para logging de métricas
 */
export class ConsoleMetricsObserver implements IMetricsObserver {
  onMetricCollected(metric: IMetric): void {
    const tagsStr = metric.tags 
      ? ` [${Object.entries(metric.tags).map(([k, v]) => `${k}=${v}`).join(', ')}]`
      : '';
    
    console.log(
      `[METRIC] ${metric.name}${tagsStr}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''} at ${metric.timestamp.toISOString()}`
    );
  }
}

/**
 * Observador para armazenamento de métricas em memória
 * Útil para testes e desenvolvimento
 */
export class InMemoryMetricsObserver implements IMetricsObserver {
  private metrics: IMetric[] = [];
  private maxMetrics: number;
  
  constructor(maxMetrics: number = 1000) {
    this.maxMetrics = maxMetrics;
  }
  
  onMetricCollected(metric: IMetric): void {
    this.metrics.push(metric);
    
    // Remove métricas antigas se exceder o limite
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
  
  getMetrics(): IMetric[] {
    return [...this.metrics];
  }
  
  getMetricsByName(name: string): IMetric[] {
    return this.metrics.filter(m => m.name === name);
  }
  
  getMetricsCount(): number {
    return this.metrics.length;
  }
  
  clear(): void {
    this.metrics = [];
  }
  
  getLatestMetric(name: string): IMetric | undefined {
    const filtered = this.getMetricsByName(name);
    return filtered[filtered.length - 1];
  }
  
  getAverageValue(name: string): number {
    const filtered = this.getMetricsByName(name);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }
}

/**
 * Decorator para medição automática de tempo de execução
 * Implementa Decorator Pattern
 */
export function measureExecutionTime(
  metricsCollector: IMetricsCollector,
  metricName: string,
  tags?: Record<string, string>
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        metricsCollector.recordTimer(metricName, duration, {
          ...tags,
          method: propertyName,
          status: 'success'
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        metricsCollector.recordTimer(metricName, duration, {
          ...tags,
          method: propertyName,
          status: 'error'
        });
        
        throw error;
      }
    };
  };
}

/**
 * Singleton para acesso global ao coletor de métricas
 */
export class GlobalMetricsCollector {
  private static instance: MetricsCollector;
  
  public static getInstance(): MetricsCollector {
    if (!GlobalMetricsCollector.instance) {
      GlobalMetricsCollector.instance = new MetricsCollector();
      
      // Adiciona observador padrão para console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        GlobalMetricsCollector.instance.addObserver(new ConsoleMetricsObserver());
      }
    }
    
    return GlobalMetricsCollector.instance;
  }
  
  public static reset(): void {
    GlobalMetricsCollector.instance = new MetricsCollector();
  }
}