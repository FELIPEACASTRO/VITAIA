/**
 * Value Object para Email seguindo Domain-Driven Design
 * Implementa validação e encapsulamento de regras de negócio
 *
 * Complexidade de validação: O(1) - regex tem tamanho fixo
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  private constructor(private readonly value: string) {
    if (!Email.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }

  /**
   * Factory method para criar instância de Email
   * @param value String do email
   * @returns Instância válida de Email
   */
  public static create(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }

  /**
   * Valida formato do email
   * @param value String a ser validada
   * @returns true se válido
   */
  public static isValid(value: string): boolean {
    return Email.EMAIL_REGEX.test(value);
  }

  /**
   * Retorna o valor do email
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Retorna o domínio do email
   */
  public getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Compara dois emails
   */
  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * Representação string
   */
  public toString(): string {
    return this.value;
  }
}
