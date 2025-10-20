import { ILogger } from "@domain/dto/Logger";
import { Appointment } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";


export class FindAppointment {
    constructor(private appointmentRepository: IAppointmentRepository,
        private logger: ILogger
    ) { }

    async execute(insuredId: string): Promise<Appointment[]> {
        this.logger.info(`CasoUso findById: ${insuredId}`);

        if (insuredId == "") {
            throw new Error("Falta InsuredId");
        }
        return await this.appointmentRepository.findById(insuredId);
    }
}