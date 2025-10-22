import { InvalidDateError } from "@domain/errors/DomainErrors";
import { IDateValidator } from "@domain/dto/IDateValidator";

export class AppointmentDate {
    private readonly value: string;

    constructor(value: string, dateValidator: IDateValidator) {
        this.validate(value, dateValidator);
        this.value = value;
    }

    private validate(value: string, dateValidator: IDateValidator): void {
        if (typeof value !== 'string') {
            throw new InvalidDateError('La fecha de la cita tiene que ser string');
        }

        if (!value || value.trim() === '') {
            throw new InvalidDateError('La fecha de la cita no puede estar vacía');
        }

        if (!dateValidator.isValid(value)) {
            throw new InvalidDateError(
                `La fecha y hora proporcionada ('${value}') no tiene un formato válido ISO 8601`
            );
        }
    }

    getValue(): string {
        return this.value;
    }

    toDate(): Date {
        return new Date(this.value);
    }

    equals(other: AppointmentDate): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
