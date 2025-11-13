/**
 * Interface base para casos de uso seguindo Clean Architecture
 * Implementa Single Responsibility Principle - cada caso de uso tem uma responsabilidade específica
 * 
 * Complexidade: O(1) - operação constante por definição de interface
 */
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * Interface para casos de uso síncronos
 * Abstração - permite diferentes tipos de execução
 */
export interface ISyncUseCase<TRequest, TResponse> {
  execute(request: TRequest): TResponse;
}

/**
 * Interface para casos de uso que podem falhar
 * Coesão - agrupa funcionalidades relacionadas ao tratamento de erros
 */
export interface IFallibleUseCase<TRequest, TResponse, TError = Error> {
  execute(request: TRequest): Promise<TResponse | TError>;
}