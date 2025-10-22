import { Appointment } from "@domain/entities/appointment";

export interface IAppointmentRepository {
    findById(id: string): Promise<Appointment[]>;
    save(appointment: Appointment): Promise<Appointment>;
    updateStatus(
        insuredId: string,
        scheduleId: string,
        newStatus: string
    ): Promise<void>;
}