import { RegisterAppointment } from "@application/registerAppointment";
import { Appointment } from "@domain/entities/appointment";
import { payloadGenericRequestDTO, ScheduleAppointmentRequestDTO, ScheduleAppointmentResponseDTO } from "./dtos";
import { FindAppointment } from "@application/findAppointment";
import { ILogger } from "@domain/dto/Logger";

export const httpController = (
    registerAppointmentUseCase: RegisterAppointment,
    findAppointmentUseCase: FindAppointment,
    logger: ILogger
) => {

    return async (
        event: payloadGenericRequestDTO //ScheduleAppointmentRequestDTO
    ): Promise<ScheduleAppointmentResponseDTO | Appointment[] | undefined | null> => {
        logger.info(`Ejecución opereación: ${event.action} con data: ${event.data}`);

        var result;
        try {
            switch (event.action) {
                case "register": {
                    const useCaseInput = event.data;
                    result = await registerAppointmentUseCase.execute(useCaseInput);
                    logger.info(`Registro cita: ${JSON.stringify(result)}`);
                    break;
                }
                case "find": {
                    const insuredId = event.data;
                    result = await findAppointmentUseCase.execute(insuredId);
                    logger.info(`Busqueda cita: ${JSON.stringify(result)}`);
                }
            }

            return result;


        } catch (error) {
            const errorName = (error as Error).name;
            const errorMessage = (error as Error).message;

            throw new Error(JSON.stringify({
                error: errorName,
                message: errorMessage
            }));
        }

    };
};