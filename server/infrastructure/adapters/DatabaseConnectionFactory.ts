/**
 * Design Patterns Implementation
 * 
 * Patterns Used:
 * - Singleton Pattern: Database connection pool management
 * - Factory Pattern: Database connection creation
 * - Adapter Pattern: Database abstraction
 * - Observer Pattern: Connection monitoring
 * - Strategy Pattern: Different database implementations
 * 
 * Complexity Analysis:
 * - Connection creation: O(1)
 * - Pool management: O(1) for get/release
 * - Health check: O(k) where k is number of connections
 * - Query execution: O(1) for connection + query complexity
 */

import { IDatabaseConnection } from "../database/PatientRepository";

// Database configuration interface
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  maxConnections?: number;
  minConnections?: number;
  acquireTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  ssl?: boolean;
}

// Connection pool statistics
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalAcquired: number;
  totalReleased: number;
  totalCreated: number;
  totalDestroyed: number;
}

// Connection health status
export interface ConnectionHealth {
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  error?: string;
}

// Observer interface for connection events
export interface IConnectionObserver {
  onConnectionCreated(connectionId: string): void;
  onConnectionDestroyed(connectionId: string): void;
  onConnectionAcquired(connectionId: string): void;
  onConnectionReleased(connectionId: string): void;
  onConnectionError(connectionId: string, error: Error): void;
}

// Abstract Database Connection (Strategy Pattern)
export abstract class BaseDatabaseConnection implements IDatabaseConnection {
  protected connectionId: string;
  protected isConnected: boolean = false;
  protected lastUsed: Date = new Date();
  protected observers: IConnectionObserver[] = [];

  constructor(protected config: DatabaseConfig) {
    this.connectionId = crypto.randomUUID();
  }

  abstract query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  abstract queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  abstract execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: number }>;
  abstract transaction<T>(callback: (connection: IDatabaseConnection) => Promise<T>): Promise<T>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isAlive(): Promise<boolean>;

  getConnectionId(): string {
    return this.connectionId;
  }

  getLastUsed(): Date {
    return this.lastUsed;
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  addObserver(observer: IConnectionObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: IConnectionObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  protected notifyObservers(event: keyof IConnectionObserver, ...args: any[]): void {
    this.observers.forEach(observer => {
      const method = observer[event] as Function;
      if (method) {
        method.apply(observer, args);
      }
    });
  }

  protected updateLastUsed(): void {
    this.lastUsed = new Date();
  }
}

// MySQL Connection Implementation
export class MySQLConnection extends BaseDatabaseConnection {
  private connection: any; // Would be mysql2.Connection in real implementation

  async connect(): Promise<void> {
    try {
      // Simulate MySQL connection
      // this.connection = mysql.createConnection(this.config);
      this.isConnected = true;
      this.notifyObservers('onConnectionCreated', this.connectionId);
    } catch (error) {
      this.notifyObservers('onConnectionError', this.connectionId, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      // await this.connection.end();
      this.isConnected = false;
      this.notifyObservers('onConnectionDestroyed', this.connectionId);
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    this.updateLastUsed();
    try {
      // Simulate query execution
      // const [rows] = await this.connection.execute(sql, params);
      // return rows as T[];
      return [] as T[];
    } catch (error) {
      this.notifyObservers('onConnectionError', this.connectionId, error as Error);
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: number }> {
    this.updateLastUsed();
    try {
      // Simulate execute
      // const [result] = await this.connection.execute(sql, params);
      // return { affectedRows: result.affectedRows, insertId: result.insertId };
      return { affectedRows: 1, insertId: 1 };
    } catch (error) {
      this.notifyObservers('onConnectionError', this.connectionId, error as Error);
      throw error;
    }
  }

  async transaction<T>(callback: (connection: IDatabaseConnection) => Promise<T>): Promise<T> {
    this.updateLastUsed();
    try {
      // await this.connection.beginTransaction();
      const result = await callback(this);
      // await this.connection.commit();
      return result;
    } catch (error) {
      // await this.connection.rollback();
      this.notifyObservers('onConnectionError', this.connectionId, error as Error);
      throw error;
    }
  }

  async isAlive(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// PostgreSQL Connection Implementation
export class PostgreSQLConnection extends BaseDatabaseConnection {
  private client: any; // Would be pg.Client in real implementation

  async connect(): Promise<void> {
    try {
      // Simulate PostgreSQL connection
      // this.client = new Client(this.config);
      // await this.client.connect();
      this.isConnected = true;
      this.notifyObservers('onConnectionCreated', this.connectionId);
    } catch (error) {
      this.notifyObservers('onConnectionError', this.connectionId, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // await this.client.end();
      this.isConnected = false;
      this.notifyObservers('onConnectionDestroyed', this.connectionId);
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    this.updateLastUsed();
    try {
      // Simulate query execution
      // const result = await this.client.query(sql, params);
      // return result.rows as T[];
      return [] as T[];
    } catch (error) {
      this.notifyObservers('onConnectionError', this.connectionId, error as Error);
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: number }> {
    this.updateLastUsed();
    try {
      // Simulate execute
      // const result = await this.client.query(sql, params);
      // return { affectedRows: result.rowCount || 0 };
      return { affectedRows: 1 };
    } catch (error) {
      this.notifyObservers('onConnectionError', this.connectionId, error as Error);
      throw error;
    }
  }

  async transaction<T>(callback: (connection: IDatabaseConnection) => Promise<T>): Promise<T> {
    this.updateLastUsed();
    try {
      // await this.client.query('BEGIN');
      const result = await callback(this);
      // await this.client.query('COMMIT');
      return result;
    } catch (error) {
      // await this.client.query('ROLLBACK');
      this.notifyObservers('onConnectionError', this.connectionId, error as Error);
      throw error;
    }
  }

  async isAlive(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Connection Pool (Singleton Pattern)
export class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private connections: Map<string, BaseDatabaseConnection> = new Map();
  private availableConnections: BaseDatabaseConnection[] = [];
  private busyConnections: Set<string> = new Set();
  private waitingQueue: Array<{
    resolve: (connection: BaseDatabaseConnection) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];
  
  private config: DatabaseConfig;
  private maxConnections: number;
  private minConnections: number;
  private acquireTimeoutMillis: number;
  private idleTimeoutMillis: number;
  
  // Statistics
  private stats = {
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    totalDestroyed: 0
  };

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.maxConnections = config.maxConnections || 10;
    this.minConnections = config.minConnections || 2;
    this.acquireTimeoutMillis = config.acquireTimeoutMillis || 30000;
    this.idleTimeoutMillis = config.idleTimeoutMillis || 300000; // 5 minutes
    
    this.initializeMinConnections();
    this.startIdleConnectionCleanup();
  }

  /**
   * Get singleton instance (Singleton Pattern)
   * @complexity O(1)
   */
  public static getInstance(config?: DatabaseConfig): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      if (!config) {
        throw new Error("Database configuration is required for first initialization");
      }
      DatabaseConnectionPool.instance = new DatabaseConnectionPool(config);
    }
    return DatabaseConnectionPool.instance;
  }

  /**
   * Acquire connection from pool
   * @complexity O(1) average case, O(n) worst case when creating new connection
   */
  async acquireConnection(): Promise<BaseDatabaseConnection> {
    // Try to get available connection
    if (this.availableConnections.length > 0) {
      const connection = this.availableConnections.pop()!;
      this.busyConnections.add(connection.getConnectionId());
      this.stats.totalAcquired++;
      
      // Check if connection is still alive
      if (await connection.isAlive()) {
        return connection;
      } else {
        // Connection is dead, remove it and try again
        await this.destroyConnection(connection);
        return this.acquireConnection();
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.maxConnections) {
      const connection = await this.createConnection();
      this.busyConnections.add(connection.getConnectionId());
      this.stats.totalAcquired++;
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error("Connection acquire timeout"));
      }, this.acquireTimeoutMillis);

      this.waitingQueue.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: new Date()
      });
    });
  }

  /**
   * Release connection back to pool
   * @complexity O(1)
   */
  releaseConnection(connection: BaseDatabaseConnection): void {
    const connectionId = connection.getConnectionId();
    
    if (!this.busyConnections.has(connectionId)) {
      console.warn(`Attempting to release connection that is not busy: ${connectionId}`);
      return;
    }

    this.busyConnections.delete(connectionId);
    this.stats.totalReleased++;

    // Serve waiting request if any
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift()!;
      this.busyConnections.add(connectionId);
      this.stats.totalAcquired++;
      waiting.resolve(connection);
      return;
    }

    // Return to available pool
    this.availableConnections.push(connection);
  }

  /**
   * Get pool statistics
   * @complexity O(1)
   */
  getStats(): PoolStats {
    return {
      totalConnections: this.connections.size,
      activeConnections: this.busyConnections.size,
      idleConnections: this.availableConnections.length,
      waitingRequests: this.waitingQueue.length,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
      totalCreated: this.stats.totalCreated,
      totalDestroyed: this.stats.totalDestroyed
    };
  }

  /**
   * Check pool health
   * @complexity O(n) where n is number of connections
   */
  async checkHealth(): Promise<ConnectionHealth[]> {
    const healthChecks: Promise<ConnectionHealth>[] = [];
    
    for (const connection of this.connections.values()) {
      healthChecks.push(this.checkConnectionHealth(connection));
    }

    return Promise.all(healthChecks);
  }

  /**
   * Close all connections and shutdown pool
   * @complexity O(n) where n is number of connections
   */
  async shutdown(): Promise<void> {
    // Clear waiting queue
    this.waitingQueue.forEach(waiting => {
      waiting.reject(new Error("Connection pool is shutting down"));
    });
    this.waitingQueue.clear();

    // Close all connections
    const closePromises: Promise<void>[] = [];
    for (const connection of this.connections.values()) {
      closePromises.push(this.destroyConnection(connection));
    }

    await Promise.all(closePromises);
    
    this.connections.clear();
    this.availableConnections.length = 0;
    this.busyConnections.clear();
  }

  // Private methods

  private async initializeMinConnections(): Promise<void> {
    const createPromises: Promise<BaseDatabaseConnection>[] = [];
    
    for (let i = 0; i < this.minConnections; i++) {
      createPromises.push(this.createConnection());
    }

    const connections = await Promise.all(createPromises);
    this.availableConnections.push(...connections);
  }

  private async createConnection(): Promise<BaseDatabaseConnection> {
    const connection = DatabaseConnectionFactory.createConnection(this.config);
    await connection.connect();
    
    this.connections.set(connection.getConnectionId(), connection);
    this.stats.totalCreated++;
    
    return connection;
  }

  private async destroyConnection(connection: BaseDatabaseConnection): Promise<void> {
    const connectionId = connection.getConnectionId();
    
    try {
      await connection.disconnect();
    } catch (error) {
      console.warn(`Error disconnecting connection ${connectionId}:`, error);
    }

    this.connections.delete(connectionId);
    this.busyConnections.delete(connectionId);
    
    const availableIndex = this.availableConnections.indexOf(connection);
    if (availableIndex > -1) {
      this.availableConnections.splice(availableIndex, 1);
    }

    this.stats.totalDestroyed++;
  }

  private async checkConnectionHealth(connection: BaseDatabaseConnection): Promise<ConnectionHealth> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await connection.isAlive();
      return {
        isHealthy,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  private startIdleConnectionCleanup(): void {
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToDestroy: BaseDatabaseConnection[] = [];

    // Find idle connections that exceed timeout
    for (const connection of this.availableConnections) {
      const idleTime = now - connection.getLastUsed().getTime();
      
      if (idleTime > this.idleTimeoutMillis && this.connections.size > this.minConnections) {
        connectionsToDestroy.push(connection);
      }
    }

    // Destroy idle connections
    for (const connection of connectionsToDestroy) {
      await this.destroyConnection(connection);
    }
  }
}

// Factory Pattern for Database Connections
export class DatabaseConnectionFactory {
  private static connectionTypes = new Map<string, new (config: DatabaseConfig) => BaseDatabaseConnection>();

  /**
   * Register connection type
   * @complexity O(1)
   */
  static registerConnectionType(
    type: string, 
    connectionClass: new (config: DatabaseConfig) => BaseDatabaseConnection
  ): void {
    this.connectionTypes.set(type.toLowerCase(), connectionClass);
  }

  /**
   * Create database connection
   * @complexity O(1)
   */
  static createConnection(config: DatabaseConfig & { type?: string }): BaseDatabaseConnection {
    const type = config.type?.toLowerCase() || 'mysql';
    const ConnectionClass = this.connectionTypes.get(type);

    if (!ConnectionClass) {
      throw new Error(`Unsupported database type: ${type}`);
    }

    return new ConnectionClass(config);
  }

  /**
   * Get available connection types
   * @complexity O(1)
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.connectionTypes.keys());
  }
}

// Register default connection types
DatabaseConnectionFactory.registerConnectionType('mysql', MySQLConnection);
DatabaseConnectionFactory.registerConnectionType('postgresql', PostgreSQLConnection);

// Connection Observer for monitoring
export class DatabaseConnectionMonitor implements IConnectionObserver {
  private metrics = {
    connectionsCreated: 0,
    connectionsDestroyed: 0,
    connectionsAcquired: 0,
    connectionsReleased: 0,
    connectionErrors: 0
  };

  onConnectionCreated(connectionId: string): void {
    this.metrics.connectionsCreated++;
    console.log(`Connection created: ${connectionId}`);
  }

  onConnectionDestroyed(connectionId: string): void {
    this.metrics.connectionsDestroyed++;
    console.log(`Connection destroyed: ${connectionId}`);
  }

  onConnectionAcquired(connectionId: string): void {
    this.metrics.connectionsAcquired++;
    console.log(`Connection acquired: ${connectionId}`);
  }

  onConnectionReleased(connectionId: string): void {
    this.metrics.connectionsReleased++;
    console.log(`Connection released: ${connectionId}`);
  }

  onConnectionError(connectionId: string, error: Error): void {
    this.metrics.connectionErrors++;
    console.error(`Connection error ${connectionId}:`, error);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset(): void {
    Object.keys(this.metrics).forEach(key => {
      (this.metrics as any)[key] = 0;
    });
  }
}