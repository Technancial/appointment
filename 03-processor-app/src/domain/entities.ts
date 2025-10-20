// Define la estructura del mensaje de negocio puro
export interface ProcessedMessage {
    id: string; // ID del mensaje SQS o llave
    data: any; // Contenido del mensaje
    queueSource: string; // Cola de origen (PE/CL)
    timestamp: string;
}

// 1. Puerto para Persistencia (S3)
export interface IS3Repository {
    save(message: ProcessedMessage): Promise<string>; // Retorna la llave S3
}

// 2. Puerto para Notificación (EventBridge)
export interface IEventPublisher {
    publishSuccess(s3Key: string, message: ProcessedMessage): Promise<void>;
}