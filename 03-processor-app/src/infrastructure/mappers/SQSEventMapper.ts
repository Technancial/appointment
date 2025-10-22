import { SQSRecord } from 'aws-lambda';
import { ProcessedMessage } from '@domain/entities';
import { ILogger } from '@domain/Logger';

export class SQSEventMapper {
    constructor(private logger: ILogger, private queueName: string) { }

    mapToProcessedMessage(record: SQSRecord): ProcessedMessage {
        try {
            // Parse del body del mensaje
            const messageBody = JSON.parse(record.body);
            this.logger.debug(`Parsed message body`, { messageId: record.messageId });

            // Transformación del timestamp
            const timestamp = this.parseTimestamp(record.attributes.SentTimestamp);

            return {
                id: record.messageId,
                data: messageBody,
                queueSource: this.queueName,
                timestamp: timestamp,
            };
        } catch (error) {
            this.logger.error('Failed to map SQS record to ProcessedMessage', error as Error, {
                messageId: record.messageId
            });
            throw new Error(`Invalid SQS message format: ${(error as Error).message}`);
        }
    }

    private parseTimestamp(rawTimestamp: string): string {
        try {
            const timestampNumber = parseInt(rawTimestamp, 10);

            if (isNaN(timestampNumber)) {
                throw new Error(`Invalid timestamp format: ${rawTimestamp}`);
            }

            const dateObject = new Date(timestampNumber);

            if (isNaN(dateObject.getTime())) {
                throw new Error(`Invalid date from timestamp: ${timestampNumber}`);
            }

            return dateObject.toISOString();
        } catch (error) {
            this.logger.error('Failed to parse timestamp', error as Error, {
                rawTimestamp
            });
            // Fallback to current time if parsing fails
            return new Date().toISOString();
        }
    }
}
