import { IEventPublisher, IS3Repository, ProcessedMessage } from "@domain/entities";
import { ILogger } from "@domain/Logger";

export class SaveMessageUseCase {
    constructor(
        private s3Repository: IS3Repository,
        private eventPublisher: IEventPublisher,
        private logger: ILogger
    ) { }

    async execute(message: ProcessedMessage): Promise<void> {
        this.logger.info(`SaveMessage: ${JSON.stringify(message)}`);
        // 1. Lógica de negocio si es necesario (ej: transformar, validar)
        // Por ahora, solo guardaremos el mensaje tal cual.

        // 2. Persistencia (Llama al Puerto S3)
        const s3Key = await this.s3Repository.save(message);
        this.logger.info(`Dato guardado S3: ${s3Key}`);

        // 3. Notificación (Llama al Puerto EventBridge)
        await this.eventPublisher.publishSuccess(s3Key, message);
    }
}