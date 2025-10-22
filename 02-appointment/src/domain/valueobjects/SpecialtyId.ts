import { InvalidSpecialtyIdError } from "@domain/errors/DomainErrors";

export class SpecialtyId {
    private readonly value: number;

    constructor(value: number) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: number): void {
        if (value === null || value === undefined) {
            throw new InvalidSpecialtyIdError('SpecialtyId no puede ser null o undefined');
        }

        if (value <= 0) {
            throw new InvalidSpecialtyIdError('SpecialtyId debe ser un número positivo mayor a cero');
        }

        if (!Number.isInteger(value)) {
            throw new InvalidSpecialtyIdError('SpecialtyId debe ser un número entero');
        }
    }

    getValue(): number {
        return this.value;
    }

    equals(other: SpecialtyId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value.toString();
    }
}
