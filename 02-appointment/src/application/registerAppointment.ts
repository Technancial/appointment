
import { IDateValidator } from "@domain/dto/IDateValidator";
import { ILogger } from "@domain/dto/Logger";
import { Appointment, CountryISO } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { INotificationService } from "@domain/repository/INotificationService";

export interface ScheduleAppointmentInput {
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    centerId: number;
    specialtyId: number;
    medicId: number;
    date: string;
}

export interface ScheduleAppointmentOutput {
    message: string;
    id: string;
}

export class InvalidCountryError extends Error {
    constructor(country: string) {
        super(`El código de país '${country}' no está soportado.`);
        this.name = 'InvalidCountryError';
    }
}

export class InvalidDateError extends Error {
    constructor(date: string) {
        super(`La fecha y hora proporcionada ('${date}') no tiene un formato válido.`);
        this.name = 'InvalidDateError';
    }
}

export class RegisterAppointment {
    constructor(private appointmentRepository: IAppointmentRepository,
        private dateValidator: IDateValidator,
        private logger: ILogger,
        private notificationService: INotificationService
    ) { }

    async execute(input: ScheduleAppointmentInput): Promise<ScheduleAppointmentOutput> {
        this.logger.info("Iniciando agendamiento de cita.", { insuredId: input.insuredId });

        const validCountries: string[] = ['PE', 'CL'];
        const country = input.countryISO.toUpperCase();

        if (!validCountries.includes(country)) {
            throw new InvalidCountryError(input.countryISO);
        }

        if (!this.dateValidator.isValid(input.date)) {
            throw new InvalidDateError(input.date);
        }

        // validaciones
        if (input.insuredId == "") {
            throw new Error("Código Asegurado requerido");
        }

        if (input.insuredId.length < 5 || input.insuredId.length > 5) {
            throw new Error("Código Asegurado debe tener 5 carácteres");
        }


        if (input.scheduleId == 0) {
            throw new Error("ScheduleId es requerido");
        }

        if (input.centerId == 0) {
            throw new Error("Centro es requerido");
        }

        if (input.specialtyId == 0) {
            throw new Error("SpecialtyId es requerido");
        }

        if (input.medicId == 0) {
            throw new Error("MedicId es requerido");
        }

        if (!this.dateValidator.isValid(input.date)) {
            throw new Error("La fecha no tiene el formato correcto");
        }

        const appointment = new Appointment(
            input.scheduleId, input.centerId, input.specialtyId,
            input.medicId, input.date, input.insuredId,
            country as CountryISO
        );


        appointment.assignEstado("pending");

        await this.appointmentRepository.save(appointment);

        await this.notificationService.sendAppointmentScheduled(appointment);

        return {
            message: `cita para ${country} recibido y en proceso.`,
            id: appointment.scheduleId.toString()
        };
    }
}