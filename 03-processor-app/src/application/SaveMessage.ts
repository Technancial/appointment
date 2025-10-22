import { IEventPublisher, IDBRepository, ProcessedMessage } from "@domain/entities";
import { ILogger } from "@domain/Logger";

export class SaveMessageUseCase {
    constructor(
        private dbRepository: IDBRepository,
        private eventPublisher: IEventPublisher,
        private logger: ILogger
    ) { }

    async execute(message: ProcessedMessage): Promise<void> {
        this.logger.info(`SaveMessage: ${JSON.stringify(message)}`);
        // 1. Lógica de negocio si es necesario (ej: transformar, validar)
        // Por ahora, solo guardaremos el mensaje tal cual.

        // 2. Persistencia (Llama al Puerto S3)
        await this.dbRepository.save(message);

        // 3. Notificación (Llama al Puerto EventBridge)
        await this.eventPublisher.publishSuccess(message);
    }
}