import { IDBRepository, ProcessedMessage } from "@domain/entities";
import { ILogger } from "@domain/Logger";
import { getDataSource } from "@infrastructure/rds/database";
import { AppointmentDetailsDB } from "@infrastructure/rds/message.entity";
import { Repository } from "typeorm";

export class MysqlRepository implements IDBRepository {
    private logger: ILogger;
    private appointmentRepository: Repository<AppointmentDetailsDB> | null = null;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    private async initRepository(): Promise<Repository<AppointmentDetailsDB>> {
        if (!this.appointmentRepository) {
            const dataSource = await getDataSource();
            this.appointmentRepository = dataSource.getRepository(AppointmentDetailsDB);
        }
        return this.appointmentRepository;
    }

    async save(message: ProcessedMessage): Promise<string> {
        try {
            const repo = await this.initRepository();
            const appointmentData = message.data;

            const dbRecord = repo.create({
                scheduleId: appointmentData.scheduleId,
                insuredId: appointmentData.insuredId,
                status: 'DB_SAVED',
            });

            // Guardar y obtener el registro con el ID autogenerado
            const savedRecord = await repo.save(dbRecord);

            this.logger.info(`Metadata saved to MySQL for schedule: ${appointmentData.scheduleId}`, {
                messageId: message.id,
                generatedId: savedRecord.id
            });

            // Retornar el ID autogenerado como string
            return savedRecord.id.toString();
        } catch (dbError) {
            this.logger.error("Failed to save message metadata to MySQL.", dbError as Error, {
                messageId: message.id
            });
            throw new Error("Database persistence failed.");
        }
    }
}
