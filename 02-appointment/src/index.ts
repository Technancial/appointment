import { httpController } from '@infrastructure/controller/httpController';
import { sqsNotificationController } from '@infrastructure/controller/sqsNotificationController';
import { scheduleAppointmentUseCase, findAppointmentUseCase, processNotificationUseCase, logger } from '@infrastructure/di/assembly';

export const httpHandler = httpController(
    scheduleAppointmentUseCase,
    findAppointmentUseCase,
    logger
);

export const sqsHandler = sqsNotificationController(processNotificationUseCase, logger);

export const handler = async (event: any) => {
    if (event.Records && event.Records[0].eventSource === 'aws:sqs') {
        return sqsHandler(event);
    } else if (event.action) {
        return httpHandler(event);
    } else {
        throw new Error('Unsupported event type.');
    }
};