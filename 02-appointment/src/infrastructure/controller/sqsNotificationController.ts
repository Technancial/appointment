import { ProcessNotification } from "@application/processNotification";
import { NotificationSQSEvent, NotificationMessageBody, EventBridgeNotificationDetail } from "./dtos";
import { ILogger } from "@domain/dto/Logger";

export const sqsNotificationController = (
    processNotificationUseCase: ProcessNotification,
    logger: ILogger
) => {

    return async (event: NotificationSQSEvent): Promise<void> => {

        for (const record of event.Records) {
            let messageBody: NotificationMessageBody;
            let eventDetail: EventBridgeNotificationDetail;

            try {
                // SQS envía el mensaje de EventBridge como un string JSON en el body
                messageBody = JSON.parse(record.body);

                // El campo 'detail' de EventBridge ES OTRO STRING JSON (doble parseo)
                //const eventDetail: EventBridgeNotificationDetail = JSON.parse(messageBody.detail as unknown as string);
                eventDetail = messageBody.detail as unknown as EventBridgeNotificationDetail;

                // Si 'insuredId' no está en el DTO raíz, sino en el 'detail' anidado:
                const insuredId = eventDetail.insuredId;
                const scheduleId = eventDetail.scheduleId;

                // Validar que los IDs existen antes de llamar al caso de uso
                if (!insuredId || !scheduleId) {
                    throw new Error("Required identifiers (insuredId/scheduleId) not found in EventBridge detail.");
                }

                logger.info(`Processing notification for appointment ${insuredId}/${scheduleId}`);

                // 3. Llama al Caso de Uso
                await processNotificationUseCase.execute(insuredId, scheduleId);

            } catch (error) {
                logger.error("Failed to process SQS notification message.", error as Error, {
                    messageId: record.messageId,
                    rawBody: record.body.substring(0, 256)
                });
                // Lanza error para que SQS reintente el mensaje
                throw error;
            }
        }
    };
};