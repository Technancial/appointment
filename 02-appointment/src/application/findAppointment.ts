import { ILogger } from "@domain/dto/Logger";
import { Appointment } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { InsuredId } from "@domain/valueobjects/InsuredId";

export class FindAppointment {
    constructor(
        private appointmentRepository: IAppointmentRepository,
        private logger: ILogger
    ) { }

    async execute(insuredIdValue: string): Promise<Appointment[]> {

        const insuredId = new InsuredId(insuredIdValue);

        this.logger.info(`CasoUso findById: ${insuredId.getValue()}`);

        return await this.appointmentRepository.findById(insuredId.getValue());
    }
}
