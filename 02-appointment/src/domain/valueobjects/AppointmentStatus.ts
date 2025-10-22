import { InvalidAppointmentStatusError } from "@domain/errors/DomainErrors";

export enum Status {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed'
}

export class AppointmentStatus {
    private readonly value: Status;

    constructor(value: string) {
        this.validate(value);
        this.value = value as Status;
    }

    private validate(value: string): void {
        if (!value || value.trim() === '') {
            throw new InvalidAppointmentStatusError('El estado de la cita no puede estar vacío');
        }

        const validStatuses = Object.values(Status);
        if (!validStatuses.includes(value as Status)) {
            throw new InvalidAppointmentStatusError(
                `Estado '${value}' no es válido. Estados permitidos: ${validStatuses.join(', ')}`
            );
        }
    }

    getValue(): Status {
        return this.value;
    }

    isPending(): boolean {
        return this.value === Status.PENDING;
    }

    isConfirmed(): boolean {
        return this.value === Status.CONFIRMED;
    }

    isCancelled(): boolean {
        return this.value === Status.CANCELLED;
    }

    isCompleted(): boolean {
        return this.value === Status.COMPLETED;
    }

    equals(other: AppointmentStatus): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    static pending(): AppointmentStatus {
        return new AppointmentStatus(Status.PENDING);
    }

    static confirmed(): AppointmentStatus {
        return new AppointmentStatus(Status.CONFIRMED);
    }

    static cancelled(): AppointmentStatus {
        return new AppointmentStatus(Status.CANCELLED);
    }

    static completed(): AppointmentStatus {
        return new AppointmentStatus(Status.COMPLETED);
    }
}
