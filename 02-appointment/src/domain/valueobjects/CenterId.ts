import { InvalidCenterIdError } from "@domain/errors/DomainErrors";

export class CenterId {
    private readonly value: number;

    constructor(value: number) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: number): void {
        if (value === null || value === undefined) {
            throw new InvalidCenterIdError('CenterId no puede ser null o undefined');
        }

        if (value <= 0) {
            throw new InvalidCenterIdError('CenterId debe ser un número positivo mayor a cero');
        }

        if (!Number.isInteger(value)) {
            throw new InvalidCenterIdError('CenterId debe ser un número entero');
        }
    }

    getValue(): number {
        return this.value;
    }

    equals(other: CenterId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value.toString();
    }
}
