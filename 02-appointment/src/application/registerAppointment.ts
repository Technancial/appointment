import { IDateValidator } from "@domain/dto/IDateValidator";
import { ILogger } from "@domain/dto/Logger";
import { Appointment } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { INotificationService } from "@domain/repository/INotificationService";
import { InsuredId } from "@domain/valueobjects/InsuredId";
import { ScheduleId } from "@domain/valueobjects/ScheduleId";
import { CountryISO } from "@domain/valueobjects/CountryISO";
import { CenterId } from "@domain/valueobjects/CenterId";
import { SpecialtyId } from "@domain/valueobjects/SpecialtyId";
import { MedicId } from "@domain/valueobjects/MedicId";
import { AppointmentDate } from "@domain/valueobjects/AppointmentDate";

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

export class RegisterAppointment {
    constructor(
        private appointmentRepository: IAppointmentRepository,
        private dateValidator: IDateValidator,
        private logger: ILogger,
        private notificationService: INotificationService
    ) { }

    async execute(input: ScheduleAppointmentInput): Promise<ScheduleAppointmentOutput> {
        this.logger.info("Iniciando agendamiento de cita.", { insuredId: input.insuredId });

        const insuredId = new InsuredId(input.insuredId);
        const scheduleId = new ScheduleId(input.scheduleId);
        const countryISO = new CountryISO(input.countryISO);
        const centerId = new CenterId(input.centerId);
        const specialtyId = new SpecialtyId(input.specialtyId);
        const medicId = new MedicId(input.medicId);
        const appointmentDate = new AppointmentDate(input.date, this.dateValidator);

        const appointment = new Appointment(
            scheduleId,
            centerId,
            specialtyId,
            medicId,
            appointmentDate,
            insuredId,
            countryISO
        );

        // Persistir cita
        await this.appointmentRepository.save(appointment);

        // Enviar notificación
        await this.notificationService.sendAppointmentScheduled(appointment);

        return {
            message: `cita para ${countryISO.getValue()} recibido y en proceso.`,
            id: scheduleId.toString()
        };
    }
}

