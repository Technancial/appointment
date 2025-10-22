import { InvalidScheduleIdError } from "@domain/errors/DomainErrors";

export class ScheduleId {
    private readonly value: number;

    constructor(value: number) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: number): void {
        if (value === null || value === undefined) {
            throw new InvalidScheduleIdError('ScheduleId no puede ser null o undefined');
        }

        if (value <= 0) {
            throw new InvalidScheduleIdError('ScheduleId debe ser un número positivo mayor a cero');
        }

        if (!Number.isInteger(value)) {
            throw new InvalidScheduleIdError('ScheduleId debe ser un número entero');
        }
    }

    getValue(): number {
        return this.value;
    }

    equals(other: ScheduleId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value.toString();
    }
}
