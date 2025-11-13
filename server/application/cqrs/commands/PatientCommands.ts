/**
 * CQRS Pattern - Command Side
 * 
 * Complexity Analysis:
 * - Command execution: O(1) for validation + O(log n) for persistence
 * - Event publishing: O(k) where k is number of subscribers
 * - Command validation: O(1) for simple validation
 * 
 * Microservices Patterns Applied:
 * - CQRS: Separate read/write models
 * - Event Sourcing: Commands generate events
 * - Saga Pattern: For complex workflows
 * - Domain Events: For loose coupling
 */

import { Patient, PatientId, VitalSigns, MedicalRecord } from "../../../domain/entities/Patient";
import { IPatientRepository } from "../../../domain/repositories/IPatientRepository";

// Base Command Interface
export interface ICommand {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly correlationId?: string;
}

// Base Command Handler Interface
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

// Command Result
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  events?: DomainEvent[];
}

// Domain Event Base Class
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly version: number;

  constructor(public readonly aggregateId: string, version: number = 1) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.version = version;
  }
}

// Patient Domain Events
export class PatientCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly patientData: {
      name: string;
      age: number;
      gender: string;
      email: string;
    },
    version: number = 1
  ) {
    super(aggregateId, version);
  }
}

export class PatientUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly changes: Record<string, any>,
    version: number = 1
  ) {
    super(aggregateId, version);
  }
}

export class VitalSignsUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly vitalSigns: {
      heartRate: number;
      bloodPressure: string;
      temperature: number;
      oxygenSaturation: number;
    },
    version: number = 1
  ) {
    super(aggregateId, version);
  }
}

export class PatientDeletedEvent extends DomainEvent {
  constructor(aggregateId: string, version: number = 1) {
    super(aggregateId, version);
  }
}

// Commands
export class CreatePatientCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly name: string,
    public readonly age: number,
    public readonly gender: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly address: string,
    public readonly conditions?: string[],
    public readonly allergies?: string[],
    public readonly medications?: string[],
    public readonly vitalSigns?: {
      heartRate: number;
      bloodPressure: string;
      temperature: number;
      oxygenSaturation: number;
    },
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class UpdatePatientCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly patientId: string,
    public readonly name?: string,
    public readonly conditions?: string[],
    public readonly allergies?: string[],
    public readonly medications?: string[],
    public readonly vitalSigns?: {
      heartRate: number;
      bloodPressure: string;
      temperature: number;
      oxygenSaturation: number;
    },
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class DeletePatientCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly patientId: string,
    public readonly userId?: string,
    public readonly correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

// Event Store Interface for Event Sourcing
export interface IEventStore {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getEventsFromVersion(aggregateId: string, version: number): Promise<DomainEvent[]>;
}

// Event Publisher Interface
export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

// Command Handlers
export class CreatePatientCommandHandler implements ICommandHandler<CreatePatientCommand, CommandResult<string>> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly eventStore?: IEventStore
  ) {}

  /**
   * Handle create patient command
   * @complexity O(1) for validation + O(log n) for persistence + O(k) for event publishing
   */
  async handle(command: CreatePatientCommand): Promise<CommandResult<string>> {
    try {
      // Validate command
      this.validateCreateCommand(command);

      // Generate unique patient ID
      const patientId = this.generatePatientId();

      // Create patient entity
      const patient = Patient.create({
        id: patientId,
        name: command.name,
        age: command.age,
        gender: command.gender,
        email: command.email,
        phone: command.phone,
        address: command.address,
        conditions: command.conditions,
        allergies: command.allergies,
        medications: command.medications,
        vitalSigns: command.vitalSigns
      });

      // Save to repository
      const savedPatient = await this.patientRepository.save(patient);

      // Create and publish domain event
      const event = new PatientCreatedEvent(
        savedPatient.getId().toString(),
        {
          name: savedPatient.getName(),
          age: savedPatient.getAge(),
          gender: savedPatient.getGender(),
          email: savedPatient.getEmail()
        }
      );

      // Save event to event store (if using Event Sourcing)
      if (this.eventStore) {
        await this.eventStore.saveEvents(savedPatient.getId().toString(), [event], 0);
      }

      // Publish event
      await this.eventPublisher.publish(event);

      return {
        success: true,
        data: savedPatient.getId().toString(),
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private validateCreateCommand(command: CreatePatientCommand): void {
    if (!command.name || command.name.trim().length < 2) {
      throw new Error("Patient name must be at least 2 characters long");
    }

    if (!command.email || !command.email.includes("@")) {
      throw new Error("Valid email is required");
    }

    if (command.age < 0 || command.age > 150) {
      throw new Error("Patient age must be between 0 and 150");
    }

    if (!command.phone || command.phone.trim().length < 8) {
      throw new Error("Valid phone number is required");
    }
  }

  private generatePatientId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PAT_${timestamp}_${random}`.toUpperCase();
  }
}

export class UpdatePatientCommandHandler implements ICommandHandler<UpdatePatientCommand, CommandResult<void>> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly eventStore?: IEventStore
  ) {}

  /**
   * Handle update patient command
   * @complexity O(1) for validation + O(1) for update + O(k) for event publishing
   */
  async handle(command: UpdatePatientCommand): Promise<CommandResult<void>> {
    try {
      // Validate command
      this.validateUpdateCommand(command);

      // Find existing patient
      const patientId = PatientId.create(command.patientId);
      const existingPatient = await this.patientRepository.findById(patientId);

      if (!existingPatient) {
        throw new Error("Patient not found");
      }

      // Track changes for event
      const changes: Record<string, any> = {};

      // Update patient data
      if (command.name && command.name !== existingPatient.getName()) {
        existingPatient.updateName(command.name);
        changes.name = command.name;
      }

      if (command.vitalSigns) {
        const vitalSigns = new VitalSigns(
          command.vitalSigns.heartRate,
          command.vitalSigns.bloodPressure,
          command.vitalSigns.temperature,
          command.vitalSigns.oxygenSaturation
        );
        existingPatient.updateVitalSigns(vitalSigns);
        changes.vitalSigns = command.vitalSigns;
      }

      if (command.conditions || command.allergies || command.medications) {
        const currentRecord = existingPatient.getMedicalRecord();
        const newRecord = new MedicalRecord(
          command.conditions || currentRecord.getConditions(),
          command.allergies || currentRecord.getAllergies(),
          command.medications || currentRecord.getMedications()
        );
        existingPatient.updateMedicalRecord(newRecord);
        
        if (command.conditions) changes.conditions = command.conditions;
        if (command.allergies) changes.allergies = command.allergies;
        if (command.medications) changes.medications = command.medications;
      }

      // Save updated patient
      await this.patientRepository.save(existingPatient);

      // Create and publish domain event
      const event = new PatientUpdatedEvent(
        existingPatient.getId().toString(),
        changes
      );

      // Save event to event store
      if (this.eventStore) {
        await this.eventStore.saveEvents(existingPatient.getId().toString(), [event], 1);
      }

      // Publish event
      await this.eventPublisher.publish(event);

      return {
        success: true,
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private validateUpdateCommand(command: UpdatePatientCommand): void {
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error("Patient ID is required");
    }

    if (command.name !== undefined && command.name.trim().length < 2) {
      throw new Error("Patient name must be at least 2 characters long");
    }

    // Validate vital signs if provided
    if (command.vitalSigns) {
      const vs = command.vitalSigns;
      if (vs.heartRate < 30 || vs.heartRate > 250) {
        throw new Error("Invalid heart rate");
      }
      if (vs.temperature < 30 || vs.temperature > 45) {
        throw new Error("Invalid temperature");
      }
      if (vs.oxygenSaturation < 0 || vs.oxygenSaturation > 100) {
        throw new Error("Invalid oxygen saturation");
      }
    }
  }
}

export class DeletePatientCommandHandler implements ICommandHandler<DeletePatientCommand, CommandResult<void>> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly eventStore?: IEventStore
  ) {}

  /**
   * Handle delete patient command
   * @complexity O(1) for validation + O(1) for deletion + O(k) for event publishing
   */
  async handle(command: DeletePatientCommand): Promise<CommandResult<void>> {
    try {
      // Validate command
      this.validateDeleteCommand(command);

      // Check if patient exists
      const patientId = PatientId.create(command.patientId);
      const exists = await this.patientRepository.exists(patientId);

      if (!exists) {
        throw new Error("Patient not found");
      }

      // Delete patient
      const deleted = await this.patientRepository.delete(patientId);

      if (!deleted) {
        throw new Error("Failed to delete patient");
      }

      // Create and publish domain event
      const event = new PatientDeletedEvent(command.patientId);

      // Save event to event store
      if (this.eventStore) {
        await this.eventStore.saveEvents(command.patientId, [event], 1);
      }

      // Publish event
      await this.eventPublisher.publish(event);

      return {
        success: true,
        events: [event]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private validateDeleteCommand(command: DeletePatientCommand): void {
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error("Patient ID is required");
    }
  }
}

// Command Bus Interface
export interface ICommandBus {
  send<TCommand extends ICommand, TResult>(command: TCommand): Promise<CommandResult<TResult>>;
  register<TCommand extends ICommand, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void;
}

// Command Bus Implementation
export class CommandBus implements ICommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>();

  /**
   * Send command to appropriate handler
   * @complexity O(1) for handler lookup + handler complexity
   */
  async send<TCommand extends ICommand, TResult>(command: TCommand): Promise<CommandResult<TResult>> {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);

    if (!handler) {
      return {
        success: false,
        error: `No handler registered for command: ${commandName}`
      };
    }

    try {
      return await handler.handle(command);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Register command handler
   * @complexity O(1)
   */
  register<TCommand extends ICommand, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType.name, handler);
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