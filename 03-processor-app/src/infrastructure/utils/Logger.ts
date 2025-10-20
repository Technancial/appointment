import { ILogger } from '@domain/Logger';
import pino from 'pino';

// 💡 Configuración de Pino para Lambda
// Usamos pino.stdSerializers.err para asegurar que los objetos Error se registren correctamente.
const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info', // Nivel desde variables de entorno
    base: {
        service: 'proccesor-lambda', // Nombre del servicio
        environment: process.env.NODE_ENV || 'development'
    },
    timestamp: pino.stdTimeFunctions.isoTime, // Asegura que la marca de tiempo esté en formato ISO
});

export class PinoLoggerAdapter implements ILogger {
    private logger = pinoLogger;

    debug(message: string, context?: Record<string, any>): void {
        this.logger.debug({ ...context }, message);
    }

    info(message: string, context?: Record<string, any>): void {
        this.logger.info({ ...context }, message);
    }

    warn(message: string, context?: Record<string, any>): void {
        this.logger.warn({ ...context }, message);
    }

    error(message: string, error?: Error, context?: Record<string, any>): void {
        // Usa el serializador de error de Pino
        this.logger.error({
            err: error,
            ...context
        }, message);
    }
}