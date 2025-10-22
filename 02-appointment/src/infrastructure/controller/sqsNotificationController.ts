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
                messageBody = JSON.parse(record.body);
                logger.info(`messageBody: ${JSON.stringify(messageBody)}`);

                eventDetail = messageBody.detail as unknown as EventBridgeNotificationDetail;
                logger.info(`eventDetail: ${JSON.stringify(eventDetail)}`);

                const insuredId = eventDetail.insuredId;
                const scheduleId = eventDetail.scheduleId;

                if (!insuredId || !scheduleId) {
                    throw new Error("Required identifiers (insuredId/scheduleId) not found in EventBridge detail.");
                }

                logger.info(`Processing notification for appointment ${insuredId}/${scheduleId}`);

                await processNotificationUseCase.execute(insuredId, scheduleId);

            } catch (error) {
                logger.error("Failed to process SQS notification message.", error as Error, {
                    messageId: record.messageId,
                    rawBody: record.body.substring(0, 256)
                });
                throw error;
            }
        }
    };
};