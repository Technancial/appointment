import { SQSEvent, Context } from 'aws-lambda';
import { S3Repository } from './repository/S3Repository';
import { EventBridgePublisher } from './repository/EventBridgePublisher';
import { SaveMessageUseCase } from '@application/SaveMessage';
import { ProcessedMessage } from '@domain/entities';
import { PinoLoggerAdapter } from './utils/Logger';
import { MysqlRepository } from './repository/MysqlRepository';

export const logger = new PinoLoggerAdapter();

const dbRepository = new MysqlRepository(logger);
const eventPublisher = new EventBridgePublisher(logger);
const saveMessageUseCase = new SaveMessageUseCase(dbRepository, eventPublisher, logger);

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {

    // Obtenido de la variable de entorno del CDK
    const queueName = process.env.SQS_QUEUE_NAME || 'UnknownQueue';

    for (const record of event.Records) {
        try {
            logger.info(`Record: ${JSON.stringify(record)}`);

            // Mapeo del evento SQS a la entidad de Dominio/Aplicación
            const messageBody = JSON.parse(record.body);
            logger.info(`processor event: ${JSON.stringify(messageBody)}`);

            // 💡 PASO 1: LIMPIEZA Y CONVERSIÓN SEGURA DEL TIMESTAMP
            const rawTimestamp = record.attributes.SentTimestamp;

            const timestampNumber = parseInt(rawTimestamp, 10);

            const dateObject = new Date(timestampNumber);

            const dateISO = dateObject.toISOString();

            const processedMessage: ProcessedMessage = {
                id: record.messageId,
                data: messageBody,
                queueSource: queueName, // Identificador de país
                timestamp: dateISO,
            };
            logger.info(`processedMessage: ${processedMessage}`);

            // Ejecución del Caso de Uso
            await saveMessageUseCase.execute(processedMessage);

        } catch (error) {
            console.error(`Error processing message ${record.messageId} from ${queueName}:`, error);
            // Si la función lanza un error, SQS reintentará el mensaje automáticamente.
            throw error;
        }
    }
};