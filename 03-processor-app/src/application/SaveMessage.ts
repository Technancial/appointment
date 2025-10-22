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

        await this.dbRepository.save(message);

        await this.eventPublisher.publishSuccess(message);
    }
}