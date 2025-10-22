import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { Status } from "@domain/valueobjects/AppointmentStatus";
import { InsuredId } from "@domain/valueobjects/InsuredId";
import { ScheduleId } from "@domain/valueobjects/ScheduleId";

export class ProcessNotification {
    constructor(private appointmentRepository: IAppointmentRepository) { }

    async execute(insuredIdValue: string, scheduleIdValue: string): Promise<void> {

        const insuredId = new InsuredId(insuredIdValue);
        const scheduleId = new ScheduleId(parseInt(scheduleIdValue, 10));

        return this.appointmentRepository.updateStatus(
            insuredId.getValue(),
            scheduleId.toString(),
            Status.COMPLETED
        );
    }
}
