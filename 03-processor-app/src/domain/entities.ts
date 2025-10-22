
export interface ProcessedMessage {
    id: string; // ID del mensaje SQS o llave
    data: any; // Contenido del mensaje
    queueSource: string; // Cola de origen (PE/CL)
    timestamp: string;
}


export interface IDBRepository {
    save(message: ProcessedMessage): Promise<string>; // Retorna la llave S3
}


export interface IEventPublisher {
    publishSuccess(message: ProcessedMessage): Promise<void>;
}