/**
 * Interface base para repositórios seguindo o padrão Repository
 * Implementa os princípios SOLID - Interface Segregation Principle
 */
export interface IRepository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: K, entity: Partial<T>): Promise<T | null>;
  delete(id: K): Promise<boolean>;
}

/**
 * Interface para repositórios com busca paginada
 * Extensibilidade - permite adicionar funcionalidades sem modificar a interface base
 */
export interface IPaginatedRepository<T, K = string> extends IRepository<T, K> {
  findWithPagination(page: number, limit: number): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
  }>;
}

/**
 * Interface para repositórios com busca por filtros
 * Abstração - define contratos sem implementação específica
 */
export interface IFilterableRepository<T, F, K = string> extends IRepository<T, K> {
  findByFilter(filter: F): Promise<T[]>;
}