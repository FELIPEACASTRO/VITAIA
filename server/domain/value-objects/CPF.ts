/**
 * Value Object para CPF seguindo Domain-Driven Design
 * Implementa validação específica do Brasil
 * 
 * Complexidade de validação: O(1) - algoritmo de validação tem tamanho fixo
 */
export class CPF {
  private static readonly CPF_REGEX = /^\d{11}$/;
  
  private constructor(private readonly value: string) {
    if (!CPF.isValid(value)) {
      throw new Error(`Invalid CPF: ${value}`);
    }
  }
  
  /**
   * Factory method para criar instância de CPF
   * @param value String do CPF (com ou sem formatação)
   * @returns Instância válida de CPF
   */
  public static create(value: string): CPF {
    const cleanValue = value.replace(/\D/g, '');
    return new CPF(cleanValue);
  }
  
  /**
   * Valida CPF usando algoritmo oficial
   * @param value CPF sem formatação
   * @returns true se válido
   */
  public static isValid(value: string): boolean {
    const cleanValue = value.replace(/\D/g, '');
    
    if (!CPF.CPF_REGEX.test(cleanValue)) {
      return false;
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanValue)) {
      return false;
    }
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanValue.charAt(i)) * (10 - i);
    }
    
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanValue.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanValue.charAt(i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanValue.charAt(10))) return false;
    
    return true;
  }
  
  /**
   * Retorna CPF sem formatação
   */
  public getValue(): string {
    return this.value;
  }
  
  /**
   * Retorna CPF formatado
   */
  public getFormatted(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  /**
   * Compara dois CPFs
   */
  public equals(other: CPF): boolean {
    return this.value === other.value;
  }
  
  /**
   * Representação string
   */
  public toString(): string {
    return this.getFormatted();
  }
}