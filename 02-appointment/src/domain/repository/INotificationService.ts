import { Appointment } from "@domain/entities/appointment";

export interface INotificationService {
    sendAppointmentScheduled(appointment: Appointment): Promise<void>;
}