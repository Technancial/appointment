import { RegisterAppointment } from "@application/registerAppointment";
import { Appointment } from "@domain/entities/appointment";
import { payloadGenericRequestDTO, ScheduleAppointmentResponseDTO } from "./dtos";
import { FindAppointment } from "@application/findAppointment";
import { ILogger } from "@domain/dto/Logger";
import { DomainError } from "@domain/errors/DomainErrors";

export const httpController = (
    registerAppointmentUseCase: RegisterAppointment,
    findAppointmentUseCase: FindAppointment,
    logger: ILogger
) => {
    return async (
        event: payloadGenericRequestDTO
    ): Promise<ScheduleAppointmentResponseDTO | Appointment[] | undefined | null> => {
        logger.debug(`Ejecución operación: ${event.action} con data: ${JSON.stringify(event.data)}`);

        let result;
        try {
            switch (event.action) {
                case "register": {
                    const useCaseInput = event.data;
                    result = await registerAppointmentUseCase.execute(useCaseInput);
                    logger.info(`Registro cita exitoso: ${JSON.stringify(result)}`);
                    break;
                }
                case "find": {
                    const insuredId = event.data;
                    result = await findAppointmentUseCase.execute(insuredId);
                    logger.info(`Búsqueda cita exitosa: ${JSON.stringify(result)}`);
                    break;
                }
                default:
                    throw new Error(`Acción '${event.action}' no soportada`);
            }

            return result;
        } catch (error) {
            const errorName = (error as Error).name;
            const errorMessage = (error as Error).message;

            if (error instanceof DomainError) {
                logger.error('Domain error occurred', error, {
                    errorCode: error.errorCode,
                    action: event.action
                });
            } else {
                logger.error('Unexpected error occurred', error as Error, {
                    action: event.action
                });
            }

            throw new Error(JSON.stringify({
                error: errorName,
                message: errorMessage,
                errorCode: error instanceof DomainError ? error.errorCode : 'UNKNOWN_ERROR'
            }));
        }
    };
};
