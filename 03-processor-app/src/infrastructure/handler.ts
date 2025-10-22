import { SQSEvent, Context } from 'aws-lambda';
import { EventBridgePublisher } from './repository/EventBridgePublisher';
import { SaveMessageUseCase } from '@application/SaveMessage';
import { PinoLoggerAdapter } from './utils/Logger';
import { MysqlRepository } from './repository/MysqlRepository';
import { ConfigService } from './config/ConfigService';
import { SQSEventMapper } from './mappers/SQSEventMapper';

// Inicialización del logger y configuración
export const logger = new PinoLoggerAdapter();
const config = ConfigService.getInstance();

// Inicialización de repositorios y servicios
const dbRepository = new MysqlRepository(logger);
const eventPublisher = new EventBridgePublisher(logger, config);
const saveMessageUseCase = new SaveMessageUseCase(dbRepository, eventPublisher, logger);

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
    const queueName = config.sqsQueueName;
    const eventMapper = new SQSEventMapper(logger, queueName);

    for (const record of event.Records) {
        try {
            logger.info(`Processing SQS record`, {
                messageId: record.messageId,
                queueName: queueName
            });

            // Mapeo del evento SQS a la entidad de Dominio
            const processedMessage = eventMapper.mapToProcessedMessage(record);

            logger.info(`Mapped message successfully`, {
                messageId: processedMessage.id,
                queueSource: processedMessage.queueSource
            });

            // Ejecución del Caso de Uso
            await saveMessageUseCase.execute(processedMessage);

            logger.info(`Message processed successfully`, {
                messageId: record.messageId
            });
        } catch (error) {
            logger.error(`Error processing message ${record.messageId} from ${queueName}`, error as Error, {
                messageId: record.messageId,
                queueName: queueName
            });

            // SQS reintentará el mensaje automáticamente
            throw error;
        }
    }
};
