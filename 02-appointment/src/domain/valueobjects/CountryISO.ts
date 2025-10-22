import { InvalidCountryError } from "@domain/errors/DomainErrors";

export type CountryCode = 'PE' | 'CL';

export class CountryISO {
    private static readonly VALID_COUNTRIES: CountryCode[] = ['PE', 'CL'];
    private readonly value: CountryCode;

    constructor(value: string) {
        const normalized = this.normalize(value);
        this.validate(normalized);
        this.value = normalized;
    }

    private normalize(value: string): CountryCode {
        return value.toUpperCase() as CountryCode;
    }

    private validate(value: string): void {
        if (typeof value !== 'string') {
            throw new InvalidCountryError('Código de país tiene que ser string');
        }
        if (!value || value.trim() === '') {
            throw new InvalidCountryError('Código de país no puede estar vacío');
        }

        if (!CountryISO.VALID_COUNTRIES.includes(value as CountryCode)) {
            throw new InvalidCountryError(
                `El código de país '${value}' no está soportado. Países válidos: ${CountryISO.VALID_COUNTRIES.join(', ')}`
            );
        }
    }

    getValue(): CountryCode {
        return this.value;
    }

    equals(other: CountryISO): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    static getValidCountries(): CountryCode[] {
        return [...CountryISO.VALID_COUNTRIES];
    }
}
