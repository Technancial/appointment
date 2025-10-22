export abstract class DomainError extends Error {
    public readonly errorCode: string;

    constructor(message: string, errorCode: string) {
        super(message);
        this.name = this.constructor.name;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class InvalidInsuredIdError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_INSURED_ID');
    }
}

export class InvalidScheduleIdError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_SCHEDULE_ID');
    }
}

export class InvalidCountryError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_COUNTRY');
    }
}

export class InvalidDateError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_DATE');
    }
}

export class InvalidAppointmentStatusError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_APPOINTMENT_STATUS');
    }
}

export class InvalidCenterIdError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_CENTER_ID');
    }
}

export class InvalidSpecialtyIdError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_SPECIALTY_ID');
    }
}

export class InvalidMedicIdError extends DomainError {
    constructor(message: string) {
        super(message, 'INVALID_MEDIC_ID');
    }
}

export class AppointmentNotFoundError extends DomainError {
    constructor(insuredId: string) {
        super(`No se encontraron citas para el asegurado: ${insuredId}`, 'APPOINTMENT_NOT_FOUND');
    }
}

export class RepositoryError extends DomainError {
    constructor(message: string, originalError?: Error) {
        super(
            originalError ? `${message}: ${originalError.message}` : message,
            'REPOSITORY_ERROR'
        );
    }
}

export class NotificationError extends DomainError {
    constructor(message: string, originalError?: Error) {
        super(
            originalError ? `${message}: ${originalError.message}` : message,
            'NOTIFICATION_ERROR'
        );
    }
}
