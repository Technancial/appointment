import { ILogger } from "@domain/dto/Logger";
import { Appointment } from "@domain/entities/appointment";
import { INotificationService } from "@domain/repository/INotificationService";
import { SNS } from "aws-sdk";

export class SNSNotificationRepository implements INotificationService {
    private sns: SNS;
    private readonly topicArn: string;
    private readonly logger: ILogger;

    constructor(logger: ILogger) {
        this.sns = new SNS();
        this.topicArn = process.env.SNS_TOPIC_ARN!; // ARN del Tópico Único
        this.logger = logger;
    }

    async sendAppointmentScheduled(appointment: Appointment): Promise<void> {
        const appointmentData = JSON.stringify(appointment);
        const country = appointment.countryId;

        const params: SNS.PublishInput = {
            TopicArn: this.topicArn,
            Message: appointmentData,
            MessageAttributes: {
                // 💡 CLAVE DEL FILTRADO: Usamos un atributo de mensaje
                // Las suscripciones a este tópico usarán este campo para filtrar.
                Country: {
                    DataType: 'String',
                    StringValue: country
                },
                EventType: {
                    DataType: 'String',
                    StringValue: 'APPOINTMENT_SCHEDULED'
                }
            },
            Subject: `New Appointment Scheduled for ${country}`
        };

        try {
            const result = await this.sns.publish(params).promise();

            this.logger.info(`Published appointment to SNS topic ${this.topicArn}.`, {
                country: country,
                messageId: result.MessageId
            });
        } catch (error) {
            this.logger.error('Failed to publish to SNS.', error as Error, {
                scheduleId: appointment.scheduleId
            });
            throw new Error('Infrastructure Error: Failed to notify service.');
        }
    }
}