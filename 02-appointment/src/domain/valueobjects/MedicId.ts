import { InvalidMedicIdError } from "@domain/errors/DomainErrors";

export class MedicId {
    private readonly value: number;

    constructor(value: number) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: number): void {
        if (value === null || value === undefined) {
            throw new InvalidMedicIdError('MedicId no puede ser null o undefined');
        }

        if (value <= 0) {
            throw new InvalidMedicIdError('MedicId debe ser un número positivo mayor a cero');
        }

        if (!Number.isInteger(value)) {
            throw new InvalidMedicIdError('MedicId debe ser un número entero');
        }
    }

    getValue(): number {
        return this.value;
    }

    equals(other: MedicId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value.toString();
    }
}
