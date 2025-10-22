import { ILogger } from "@domain/dto/Logger";
import { Appointment } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { DynamoDB } from 'aws-sdk';
import { InsuredId } from "@domain/valueobjects/InsuredId";
import { ScheduleId } from "@domain/valueobjects/ScheduleId";
import { CountryISO } from "@domain/valueobjects/CountryISO";
import { CenterId } from "@domain/valueobjects/CenterId";
import { SpecialtyId } from "@domain/valueobjects/SpecialtyId";
import { MedicId } from "@domain/valueobjects/MedicId";
import { AppointmentDate } from "@domain/valueobjects/AppointmentDate";
import { IDateValidator } from "@domain/dto/IDateValidator";
import { NativeDateValidator } from "@infrastructure/utils/nativeDateValidator";
import { RepositoryError } from "@domain/errors/DomainErrors";

interface AppointmentItem {
    PK: string;
    SK: string;
    insuredId: string;
    countryId: string;
    scheduleId: number;
    centerId: number;
    specialtyId: number;
    medicId: number;
    date: string;
    status: string;
    createdAt: string;
}

export class DynamoDBAppointmentRepository implements IAppointmentRepository {
    private db: DynamoDB.DocumentClient;
    private readonly tableName: string;
    private readonly logger: ILogger;
    private readonly dateValidator: IDateValidator;

    constructor(logger: ILogger) {
        this.db = new DynamoDB.DocumentClient();
        this.tableName = process.env.APPOINTMENT_TABLE_NAME!;
        this.logger = logger;
        this.dateValidator = new NativeDateValidator();
    }

    async findById(insuredId: string): Promise<Appointment[]> {
        this.logger.info(`Repository findById: ${insuredId}`);

        const params: DynamoDB.DocumentClient.QueryInput = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pkValue',
            ExpressionAttributeValues: {
                ':pkValue': `INSURED#${insuredId}`,
            },
        };

        this.logger.info(`params: ${JSON.stringify(params)}`);

        try {
            const result = await this.db.query(params).promise();
            return result.Items ? result.Items.map(item => this.mapToAppointment(item as AppointmentItem)) : [];
        } catch (error) {
            this.logger.error('Failed to retrieve appointment data from DynamoDB.', error as Error, {
                insuredId
            });
            throw new RepositoryError('Failed to retrieve appointment data.', error as Error);
        }
    }

    private mapToAppointment(item: AppointmentItem): Appointment {
        const appointment = new Appointment(
            new ScheduleId(item.scheduleId),
            new CenterId(item.centerId),
            new SpecialtyId(item.specialtyId),
            new MedicId(item.medicId),
            new AppointmentDate(item.date, this.dateValidator),
            new InsuredId(item.insuredId),
            new CountryISO(item.countryId)
        );

        // Establecer el estado si existe
        if (item.status) {
            appointment.assignEstado(item.status);
        }

        return appointment;
    }

    async save(appointment: Appointment): Promise<Appointment> {
        const item: AppointmentItem = {
            PK: `INSURED#${appointment.insuredId}`,
            SK: `SCHEDULE#${appointment.scheduleId}`,
            insuredId: appointment.insuredId,
            countryId: appointment.countryId,
            scheduleId: appointment.scheduleId,
            centerId: appointment.centerId,
            specialtyId: appointment.specialtyId,
            medicId: appointment.medicId,
            date: appointment.date,
            status: appointment.estado,
            createdAt: new Date().toISOString(),
        };

        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: this.tableName,
            Item: item,
        };

        try {
            this.logger.debug('Attempting to save item to DynamoDB.', {
                table: this.tableName,
                pk: item.PK,
                sk: item.SK,
                status: item.status
            });

            await this.db.put(params).promise();

            this.logger.info('Appointment successfully persisted in DynamoDB.', {
                scheduleId: appointment.scheduleId,
                status: item.status
            });

            return appointment;
        } catch (error) {
            this.logger.error('Failed to save appointment data to DynamoDB.', error as Error, {
                scheduleId: appointment.scheduleId,
                country: appointment.countryId
            });
            throw new RepositoryError('Failed to persist appointment data.', error as Error);
        }
    }

    async updateStatus(
        insuredId: string,
        scheduleId: string,
        newStatus: string
    ): Promise<void> {
        const partitionKey = `INSURED#${insuredId}`;
        const sortKey = `SCHEDULE#${scheduleId}`;

        const params: DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.tableName,
            Key: {
                PK: partitionKey,
                SK: sortKey,
            },
            UpdateExpression: 'SET #status = :newStatus',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':newStatus': newStatus,
            },
            ReturnValues: 'NONE',
        };

        try {
            this.logger.debug('Attempting to update appointment status.', {
                pk: partitionKey,
                sk: sortKey,
                newStatus: newStatus
            });

            await this.db.update(params).promise();

            this.logger.info('Appointment status successfully updated in DynamoDB.', {
                scheduleId: scheduleId,
                newStatus: newStatus
            });
        } catch (error) {
            this.logger.error('Failed to update appointment status in DynamoDB.', error as Error, {
                scheduleId: scheduleId,
                currentStatus: newStatus
            });
            throw new RepositoryError('Failed to update appointment status.', error as Error);
        }
    }
}
