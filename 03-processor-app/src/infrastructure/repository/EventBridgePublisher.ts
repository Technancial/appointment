import { IEventPublisher, ProcessedMessage } from '@domain/entities';
import { ILogger } from '@domain/Logger';
import { EventBridge } from 'aws-sdk';

export class EventBridgePublisher implements IEventPublisher {
    private eventBridge = new EventBridge();
    private eventBusName: string;

    constructor(private logger: ILogger) {
        this.eventBusName = process.env.EVENT_BUS_NAME || 'default';
    }

    async publishSuccess(s3Key: string, message: ProcessedMessage): Promise<void> {
        this.logger.info(`publish Event s3key: ${s3Key} queue: ${message.data.queueName}`);

        const detail = JSON.stringify({
            s3Key: s3Key,
            //queueProcessed: message.data.queueName,
            insuredId: message.data.insuredId,
            scheduleId: message.data.scheduleId,
            //status: 'SUCCESS'
        });
        this.logger.info(`publish event detail: ${detail}`);

        await this.eventBridge.putEvents({
            Entries: [{
                Source: 'com.appointment.processor', // Debe coincidir con la regla de EventBridge del CDK
                DetailType: 'S3_SAVE_SUCCESS',
                Detail: detail,
                EventBusName: this.eventBusName,
            }]
        }).promise();
    }
}