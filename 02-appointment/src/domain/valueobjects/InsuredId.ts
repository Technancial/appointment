import { InvalidInsuredIdError } from "@domain/errors/DomainErrors";

export class InsuredId {
    private static readonly REQUIRED_LENGTH = 5;
    private readonly value: string;

    constructor(value: string) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: string): void {
        if (!value || value.trim() === '') {
            throw new InvalidInsuredIdError('InsuredId no puede estar vacío');
        }

        if (value.length !== InsuredId.REQUIRED_LENGTH) {
            throw new InvalidInsuredIdError(
                `InsuredId debe tener exactamente ${InsuredId.REQUIRED_LENGTH} caracteres`
            );
        }
    }

    getValue(): string {
        return this.value;
    }

    equals(other: InsuredId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
