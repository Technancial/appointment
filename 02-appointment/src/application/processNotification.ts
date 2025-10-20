import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";

export class ProcessNotification {
    constructor(private appointmentRepository: IAppointmentRepository) { }

    execute(insuredId: string, scheduleId: string): Promise<void> {
        return this.appointmentRepository.updateStatus(insuredId, scheduleId, "confirm");
    }
}