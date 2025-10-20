export interface payloadGenericRequestDTO {
    action: 'register' | 'find' | 'confirm';
    data: any;
}
export interface ScheduleAppointmentRequestDTO {
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    centerId: number;
    specialtyId: number;
    medicId: number;
    date: string;
}

export interface ScheduleAppointmentResponseDTO {
    message: string;
    id: string; // ID de la cita creada
}

export interface EventBridgeNotificationDetail {
    //s3Key: string;
    //queueProcessed: string;
    insuredId: string;
    scheduleId: string;
    //status: string;
}

import { SQSEvent } from "aws-lambda";
export interface NotificationSQSEvent extends SQSEvent { }

export interface NotificationMessageBody {
    source: 'com.appointment.processor';
    detailType: 'S3_SAVE_SUCCESS';
    detail: EventBridgeNotificationDetail; // El Detail es un string JSON que necesita doble parseo
    // ... otros campos de EventBridge
}