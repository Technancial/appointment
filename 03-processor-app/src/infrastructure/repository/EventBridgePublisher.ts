import { IEventPublisher, ProcessedMessage } from '@domain/entities';
import { ILogger } from '@domain/Logger';
import { EventBridge } from 'aws-sdk';
import { ConfigService } from '@infrastructure/config/ConfigService';

export class EventBridgePublisher implements IEventPublisher {
    private eventBridge: EventBridge;
    private eventBusName: string;

    constructor(private logger: ILogger, config: ConfigService) {
        this.eventBridge = new EventBridge();
        this.eventBusName = config.eventBusName;
    }

    async publishSuccess(message: ProcessedMessage): Promise<void> {
        const detail = JSON.stringify({
            insuredId: message.data.insuredId,
            scheduleId: message.data.scheduleId,
        });

        this.logger.info(`Publishing event to EventBridge`, {
            eventBusName: this.eventBusName,
            messageId: message.id
        });

        this.logger.info(`Event detail`, {
            detail: detail
        });

        try {
            await this.eventBridge.putEvents({
                Entries: [{
                    Source: 'com.appointment.processor',
                    DetailType: 'DB_SAVE_SUCCESS',
                    Detail: detail,
                    EventBusName: this.eventBusName,
                }]
            }).promise();

            this.logger.info(`Event published successfully`, {
                messageId: message.id
            });
        } catch (error) {
            this.logger.error('Failed to publish event to EventBridge', error as Error, {
                messageId: message.id,
                eventBusName: this.eventBusName
            });
            throw new Error(`EventBridge publish failed: ${(error as Error).message}`);
        }
    }
}
