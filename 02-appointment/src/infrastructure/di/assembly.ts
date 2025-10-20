import { FindAppointment } from "@application/findAppointment";
import { ProcessNotification } from "@application/processNotification";
import { RegisterAppointment } from "@application/registerAppointment";
import { IDateValidator } from "@domain/dto/IDateValidator";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { DynamoDBAppointmentRepository } from "@infrastructure/database/dinamoDBRepository";
import { SNSNotificationRepository } from "@infrastructure/database/SNSNotificationRepository";
import { PinoLoggerAdapter } from "@infrastructure/utils/Logger";
import { NativeDateValidator } from "@infrastructure/utils/nativeDateValidator";


// 1. Inicialización de Adaptadores
export const logger = new PinoLoggerAdapter();
const appointmentRepository: IAppointmentRepository = new DynamoDBAppointmentRepository(logger);
const notificationService = new SNSNotificationRepository(logger);
const dateValidator: IDateValidator = new NativeDateValidator();


// 2. Inicialización de Casos de Uso (Inyección)
export const scheduleAppointmentUseCase = new RegisterAppointment(appointmentRepository,
    dateValidator, logger, notificationService);
export const findAppointmentUseCase = new FindAppointment(appointmentRepository, logger);

export const processNotificationUseCase = new ProcessNotification(appointmentRepository);