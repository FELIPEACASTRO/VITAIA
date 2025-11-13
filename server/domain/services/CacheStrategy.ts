/**
 * Sistema de cache seguindo Strategy Pattern
 * Implementa diferentes estratégias de cache com interface comum
 * 
 * Complexidade varia por estratégia:
 * - InMemory: O(1) para get/set
 * - LRU: O(1) para get/set com eviction O(1)
 * - TTL: O(1) para get/set com cleanup O(n)
 */
export interface ICacheStrategy<T = any> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  size(): Promise<number>;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Estratégia de cache em memória simples
 * Complexidade: O(1) para todas as operações
 */
export class InMemoryCacheStrategy<T = any> implements ICacheStrategy<T> {
  private cache = new Map<string, CacheEntry<T>>();
  
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verifica TTL se definido
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Atualiza estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.value;
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now
    });
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Verifica TTL se definido
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async size(): Promise<number> {
    return this.cache.size;
  }
  
  /**
   * Limpa entradas expiradas
   * Complexidade: O(n)
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
  
  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{
    size: number;
    totalAccesses: number;
    averageAccessCount: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) {
      return {
        size: 0,
        totalAccesses: 0,
        averageAccessCount: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
    
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      size: entries.length,
      totalAccesses,
      averageAccessCount: totalAccesses / entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}

/**
 * Estratégia de cache LRU (Least Recently Used)
 * Complexidade: O(1) para todas as operações
 */
export class LRUCacheStrategy<T = any> implements ICacheStrategy<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verifica TTL se definido
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move para o final (mais recentemente usado)
    this.cache.delete(key);
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    
    // Remove entrada existente se houver
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove o menos recentemente usado (primeiro da Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now
    });
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
  
  async size(): Promise<number> {
    return this.cache.size;
  }
  
  getMaxSize(): number {
    return this.maxSize;
  }
  
  setMaxSize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    
    // Remove entradas antigas se necessário
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}

/**
 * Estratégia de cache com TTL automático
 * Complexidade: O(1) para get/set, O(n) para cleanup
 */
export class TTLCacheStrategy<T = any> implements ICacheStrategy<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(defaultTTL: number = 300000, autoCleanup: boolean = true) { // 5 minutos default
    this.defaultTTL = defaultTTL;
    
    if (autoCleanup) {
      this.startAutoCleanup();
    }
  }
  
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;
    
    // Verifica se expirou
    if (now > entry.timestamp + ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Atualiza estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.value;
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    });
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;
    
    if (now > entry.timestamp + ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async size(): Promise<number> {
    return this.cache.size;
  }
  
  /**
   * Inicia limpeza automática de entradas expiradas
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup a cada minuto
  }
  
  /**
   * Para limpeza automática
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * Limpa entradas expiradas manualmente
   * Complexidade: O(n)
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.ttl || this.defaultTTL;
      
      if (now > entry.timestamp + ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
  
  /**
   * Obtém TTL padrão
   */
  getDefaultTTL(): number {
    return this.defaultTTL;
  }
  
  /**
   * Define novo TTL padrão
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

/**
 * Factory para criar estratégias de cache
 * Implementa Factory Pattern
 */
export class CacheStrategyFactory {
  static createInMemoryCache<T = any>(): ICacheStrategy<T> {
    return new InMemoryCacheStrategy<T>();
  }
  
  static createLRUCache<T = any>(maxSize: number = 1000): ICacheStrategy<T> {
    return new LRUCacheStrategy<T>(maxSize);
  }
  
  static createTTLCache<T = any>(defaultTTL: number = 300000, autoCleanup: boolean = true): ICacheStrategy<T> {
    return new TTLCacheStrategy<T>(defaultTTL, autoCleanup);
  }
  
  static createHybridCache<T = any>(maxSize: number = 1000, defaultTTL: number = 300000): ICacheStrategy<T> {
    // Combina LRU com TTL
    return new HybridCacheStrategy<T>(maxSize, defaultTTL);
  }
}

/**
 * Estratégia híbrida que combina LRU com TTL
 * Complexidade: O(1) para get/set
 */
export class HybridCacheStrategy<T = any> implements ICacheStrategy<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;
  
  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;
    
    // Verifica TTL
    if (now > entry.timestamp + ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move para o final (LRU)
    this.cache.delete(key);
    entry.accessCount++;
    entry.lastAccessed = now;
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    
    // Remove entrada existente se houver
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove o menos recentemente usado
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    });
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;
    
    if (now > entry.timestamp + ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async size(): Promise<number> {
    return this.cache.size;
  }
}