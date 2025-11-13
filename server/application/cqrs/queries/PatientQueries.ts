/**
 * CQRS Pattern - Query Side
 * 
 * Complexity Analysis:
 * - Simple queries: O(1) with proper indexing
 * - Search queries: O(n) where n is dataset size (can be optimized)
 * - Aggregation queries: O(n) for full scans, O(log n) with proper indexing
 * - Pagination: O(1) for offset-based, O(log n) for cursor-based
 * 
 * Query Optimization Techniques:
 * - Materialized views for complex aggregations
 * - Read replicas for scaling
 * - Caching for frequently accessed data
 * - Indexing strategies for common query patterns
 */

import { PatientId } from "../../../domain/entities/Patient";

// Base Query Interface
export interface IQuery {
  readonly queryId: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly correlationId?: string;
}

// Base Query Handler Interface
export interface IQueryHandler<TQuery extends IQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

// Query Result Wrapper
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    cacheHit?: boolean;
    totalCount?: number;
  };
}

// Pagination Support
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedQueryResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metadata?: {
    executionTime: number;
    cacheHit?: boolean;
  };
}

// Read Model DTOs (optimized for queries)
export interface PatientReadModel {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  riskLevel: "low" | "medium" | "high";
  lastVisit?: Date;
  nextAppointment?: Date;
  
  // Denormalized data for performance
  conditionsCount: number;
  allergiesCount: number;
  medicationsCount: number;
  hasAbnormalVitals: boolean;
  
  // Computed fields
  daysSinceLastVisit?: number;
  riskScore: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientDetailReadModel extends PatientReadModel {
  conditions: string[];
  allergies: string[];
  medications: string[];
  vitalSigns?: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
    recordedAt: Date;
    isAbnormal: boolean;
  };
  medicalHistory: {
    totalVisits: number;
    lastDiagnoses: string[];
    chronicConditions: string[];
  };
}

export interface PatientStatsReadModel {
  totalPatients: number;
  patientsThisMonth: number;
  averageAge: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  topConditions: Array<{
    condition: string;
    count: number;
    percentage: number;
  }>;
  abnormalVitalsCount: number;
}

// Queries
export class GetPatientByIdQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly patientId: string,
    public readonly includeDetails: boolean = false,
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class SearchPatientsQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly searchTerm?: string,
    public readonly filters?: {
      ageRange?: { min: number; max: number };
      gender?: string;
      riskLevel?: "low" | "medium" | "high";
      conditions?: string[];
      hasAbnormalVitals?: boolean;
    },
    public readonly pagination?: PaginationParams,
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class GetPatientsByRiskLevelQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly riskLevel: "low" | "medium" | "high",
    public readonly pagination?: PaginationParams,
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class GetPatientsWithAbnormalVitalsQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly pagination?: PaginationParams,
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class GetPatientStatsQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly dateRange?: {
      from: Date;
      to: Date;
    },
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class GetRecentPatientsQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly limit: number = 10,
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

// Read Model Repository Interface
export interface IPatientReadModelRepository {
  findById(id: string): Promise<PatientDetailReadModel | null>;
  findByIds(ids: string[]): Promise<PatientReadModel[]>;
  search(
    searchTerm?: string,
    filters?: any,
    pagination?: PaginationParams
  ): Promise<PaginatedQueryResult<PatientReadModel>>;
  findByRiskLevel(
    riskLevel: "low" | "medium" | "high",
    pagination?: PaginationParams
  ): Promise<PaginatedQueryResult<PatientReadModel>>;
  findWithAbnormalVitals(
    pagination?: PaginationParams
  ): Promise<PaginatedQueryResult<PatientReadModel>>;
  getStats(dateRange?: { from: Date; to: Date }): Promise<PatientStatsReadModel>;
  getRecent(limit: number): Promise<PatientReadModel[]>;
  count(): Promise<number>;
}

// Cache Interface for Query Optimization
export interface IQueryCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Query Handlers
export class GetPatientByIdQueryHandler implements IQueryHandler<GetPatientByIdQuery, QueryResult<PatientDetailReadModel | PatientReadModel>> {
  constructor(
    private readonly readModelRepository: IPatientReadModelRepository,
    private readonly cache?: IQueryCache
  ) {}

  /**
   * Handle get patient by ID query
   * @complexity O(1) with proper indexing and caching
   */
  async handle(query: GetPatientByIdQuery): Promise<QueryResult<PatientDetailReadModel | PatientReadModel>> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `patient:${query.patientId}:${query.includeDetails}`;
      let cacheHit = false;
      
      if (this.cache) {
        const cached = await this.cache.get<PatientDetailReadModel | PatientReadModel>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              executionTime: Date.now() - startTime,
              cacheHit: true
            }
          };
        }
      }

      // Query from repository
      const patient = await this.readModelRepository.findById(query.patientId);

      if (!patient) {
        return {
          success: false,
          error: "Patient not found"
        };
      }

      // Cache the result
      if (this.cache) {
        await this.cache.set(cacheKey, patient, 300); // 5 minutes TTL
      }

      return {
        success: true,
        data: query.includeDetails ? patient : this.mapToBasicReadModel(patient),
        metadata: {
          executionTime: Date.now() - startTime,
          cacheHit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private mapToBasicReadModel(patient: PatientDetailReadModel): PatientReadModel {
    const { conditions, allergies, medications, vitalSigns, medicalHistory, ...basic } = patient;
    return basic;
  }
}

export class SearchPatientsQueryHandler implements IQueryHandler<SearchPatientsQuery, PaginatedQueryResult<PatientReadModel>> {
  constructor(
    private readonly readModelRepository: IPatientReadModelRepository,
    private readonly cache?: IQueryCache
  ) {}

  /**
   * Handle search patients query
   * @complexity O(n) for full-text search, O(log n) with proper indexing
   */
  async handle(query: SearchPatientsQuery): Promise<PaginatedQueryResult<PatientReadModel>> {
    const startTime = Date.now();
    
    try {
      // Generate cache key based on query parameters
      const cacheKey = this.generateSearchCacheKey(query);
      
      // Check cache
      if (this.cache) {
        const cached = await this.cache.get<PaginatedQueryResult<PatientReadModel>>(cacheKey);
        if (cached) {
          cached.metadata = {
            executionTime: Date.now() - startTime,
            cacheHit: true
          };
          return cached;
        }
      }

      // Execute search
      const result = await this.readModelRepository.search(
        query.searchTerm,
        query.filters,
        query.pagination
      );

      // Add metadata
      result.metadata = {
        executionTime: Date.now() - startTime,
        cacheHit: false
      };

      // Cache result (shorter TTL for search results)
      if (this.cache) {
        await this.cache.set(cacheKey, result, 60); // 1 minute TTL
      }

      return result;
    } catch (error) {
      return {
        data: [],
        pagination: {
          page: query.pagination?.page || 1,
          pageSize: query.pagination?.pageSize || 10,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        },
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private generateSearchCacheKey(query: SearchPatientsQuery): string {
    const parts = [
      'search',
      query.searchTerm || 'all',
      JSON.stringify(query.filters || {}),
      JSON.stringify(query.pagination || {})
    ];
    return parts.join(':');
  }
}

export class GetPatientsByRiskLevelQueryHandler implements IQueryHandler<GetPatientsByRiskLevelQuery, PaginatedQueryResult<PatientReadModel>> {
  constructor(
    private readonly readModelRepository: IPatientReadModelRepository,
    private readonly cache?: IQueryCache
  ) {}

  /**
   * Handle get patients by risk level query
   * @complexity O(n) for full scan, O(log n) with risk level index
   */
  async handle(query: GetPatientsByRiskLevelQuery): Promise<PaginatedQueryResult<PatientReadModel>> {
    const startTime = Date.now();
    
    try {
      const cacheKey = `risk:${query.riskLevel}:${JSON.stringify(query.pagination || {})}`;
      
      if (this.cache) {
        const cached = await this.cache.get<PaginatedQueryResult<PatientReadModel>>(cacheKey);
        if (cached) {
          cached.metadata = {
            executionTime: Date.now() - startTime,
            cacheHit: true
          };
          return cached;
        }
      }

      const result = await this.readModelRepository.findByRiskLevel(
        query.riskLevel,
        query.pagination
      );

      result.metadata = {
        executionTime: Date.now() - startTime,
        cacheHit: false
      };

      if (this.cache) {
        await this.cache.set(cacheKey, result, 120); // 2 minutes TTL
      }

      return result;
    } catch (error) {
      return {
        data: [],
        pagination: {
          page: query.pagination?.page || 1,
          pageSize: query.pagination?.pageSize || 10,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        },
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }
}

export class GetPatientStatsQueryHandler implements IQueryHandler<GetPatientStatsQuery, QueryResult<PatientStatsReadModel>> {
  constructor(
    private readonly readModelRepository: IPatientReadModelRepository,
    private readonly cache?: IQueryCache
  ) {}

  /**
   * Handle get patient stats query
   * @complexity O(n) for aggregations, can be optimized with materialized views
   */
  async handle(query: GetPatientStatsQuery): Promise<QueryResult<PatientStatsReadModel>> {
    const startTime = Date.now();
    
    try {
      const cacheKey = `stats:${JSON.stringify(query.dateRange || {})}`;
      
      if (this.cache) {
        const cached = await this.cache.get<PatientStatsReadModel>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              executionTime: Date.now() - startTime,
              cacheHit: true
            }
          };
        }
      }

      const stats = await this.readModelRepository.getStats(query.dateRange);

      if (this.cache) {
        await this.cache.set(cacheKey, stats, 600); // 10 minutes TTL for stats
      }

      return {
        success: true,
        data: stats,
        metadata: {
          executionTime: Date.now() - startTime,
          cacheHit: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }
}

// Query Bus Interface
export interface IQueryBus {
  send<TQuery extends IQuery, TResult>(query: TQuery): Promise<TResult>;
  register<TQuery extends IQuery, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void;
}

// Query Bus Implementation
export class QueryBus implements IQueryBus {
  private handlers = new Map<string, IQueryHandler<any, any>>();

  /**
   * Send query to appropriate handler
   * @complexity O(1) for handler lookup + handler complexity
   */
  async send<TQuery extends IQuery, TResult>(query: TQuery): Promise<TResult> {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    return await handler.handle(query);
  }

  /**
   * Register query handler
   * @complexity O(1)
   */
  register<TQuery extends IQuery, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType.name, handler);
  }

  /**
   * Get registered handlers count
   * @complexity O(1)
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }

  /**
   * Clear all handlers
   * @complexity O(1)
   */
  clear(): void {
    this.handlers.clear();
  }
}