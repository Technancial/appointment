import { ILogger } from "@domain/dto/Logger";
import { Appointment, CountryISO } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { DynamoDB } from 'aws-sdk';

interface AppointmentItem {
    PK: string; // Clave de Partición, crucial para DynamoDB
    SK: string; // Clave de Ordenación (opcional, pero buena práctica)
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

    constructor(logger: ILogger) {
        this.db = new DynamoDB.DocumentClient();
        this.tableName = process.env.APPOINTMENT_TABLE_NAME || "test";
        this.logger = logger;
    }

    async findById(insuredId: string): Promise<Appointment[]> {
        let key = { insuredId };
        this.logger.info(`Repository findById: ${key}`);

        // 1. Construir la clave de DynamoDB
        const params: DynamoDB.DocumentClient.QueryInput = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pkValue', // Condición de búsqueda
            ExpressionAttributeValues: {
                // Se proporciona solo el valor de la clave de partición
                ':pkValue': `INSURED#${insuredId}`,
            },
            // Opcional: FilterExpression para filtrar atributos no clave
        };

        this.logger.info(`params: ${JSON.stringify(params)}`);

        try {

            const result = await this.db.query(params).promise();

            return result.Items ? result.Items.map(item => this.mapToAppointment(item as AppointmentItem)) : [];

        } catch (error) {
            this.logger.error('Failed to retrieve appointment data from DynamoDB.', error as Error, {
                ...key
            });
            throw new Error('Failed to retrieve appointment data.');
        }
    }

    private mapToAppointment(item: AppointmentItem): Appointment {

        const appointment = new Appointment(
            item.scheduleId,
            item.centerId,
            item.specialtyId,
            item.medicId,
            item.date,
            item.insuredId,
            item.countryId as CountryISO
        );

        return appointment;
    }

    async save(appointment: Appointment): Promise<void> {

        const item: AppointmentItem = {
            PK: `INSURED#${appointment.insuredId}`, // Ejemplo de Clave de Partición
            SK: `SCHEDULE#${appointment.scheduleId}`, // Ejemplo de Clave de Ordenación

            // Atributos directos de la entidad:
            insuredId: appointment.insuredId,
            countryId: appointment.countryId,
            scheduleId: appointment.scheduleId,
            centerId: appointment.centerId,
            specialtyId: appointment.specialtyId,
            medicId: appointment.medicId,
            date: appointment.date,
            status: appointment.estado, // Usamos la propiedad 'estado' de la entidad
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

        } catch (error) {
            this.logger.error('Failed to save appointment data to DynamoDB.', error as Error, {
                scheduleId: appointment.scheduleId,
                country: appointment.countryId
            });
            // En un caso real, podrías lanzar un error de Infraestructura
            throw new Error('Failed to persist appointment data.');
        }
    }

    async updateStatus(
        insuredId: string,
        scheduleId: string,
        newStatus: string
    ): Promise<void> {

        const partitionKey = `INSURED#${insuredId}`;
        const sortKey = `SCHEDULE#${scheduleId}`;

        // 1. Parámetros de la Actualización
        const params: DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.tableName,

            // 💡 1a. CLAVE: Proporcionar la PK y SK completas para la operación Update
            Key: {
                PK: partitionKey,
                SK: sortKey,
            },

            // 💡 1b. EXPRESIÓN: Definir qué atributo y valor actualizar
            UpdateExpression: 'SET #status = :newStatus',

            // 💡 1c. Nombres de Atributo: Usar alias (#status) para evitar conflictos con palabras reservadas de DynamoDB
            ExpressionAttributeNames: {
                '#status': 'status',
            },

            // 💡 1d. Valores de Atributo: Usar alias (:newStatus)
            ExpressionAttributeValues: {
                ':newStatus': newStatus,
            },

            ReturnValues: 'NONE', // No necesitamos el resultado de la actualización
        };

        try {
            this.logger.debug('Attempting to update appointment status.', {
                pk: partitionKey,
                sk: sortKey,
                newStatus: newStatus
            });

            // 2. Ejecutar la Actualización
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
            // Lanza un error de Infraestructura
            throw new Error('Failed to update appointment status.');
        }
    }
}