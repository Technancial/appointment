export class ConfigService {
    private static instance: ConfigService;

    //private readonly _bucketName: string;
    private readonly _eventBusName: string;
    private readonly _sqsQueueName: string;
    private readonly _dbHost: string;
    private readonly _dbPort: number;
    private readonly _dbName: string;

    private constructor() {
        // Validar variables de entorno críticas
        //this._bucketName = this.getRequiredEnvVar('BUCKET_NAME');
        this._eventBusName = this.getEnvVar('EVENT_BUS_NAME', 'default');
        this._sqsQueueName = this.getEnvVar('SQS_QUEUE_NAME', 'UnknownQueue');
        this._dbHost = this.getRequiredEnvVar('DB_HOST');
        this._dbPort = parseInt(this.getEnvVar('DB_PORT', '3306'), 10);
        this._dbName = this.getRequiredEnvVar('DB_NAME');
    }

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private getRequiredEnvVar(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Required environment variable ${key} is not defined`);
        }
        return value;
    }

    private getEnvVar(key: string, defaultValue: string): string {
        return process.env[key] || defaultValue;
    }
    /*
    get bucketName(): string {
        return this._bucketName;
    }*/

    get eventBusName(): string {
        return this._eventBusName;
    }

    get sqsQueueName(): string {
        return this._sqsQueueName;
    }

    get dbHost(): string {
        return this._dbHost;
    }

    get dbPort(): number {
        return this._dbPort;
    }

    get dbName(): string {
        return this._dbName;
    }

    getDatabaseConfig() {
        return {
            host: this._dbHost,
            port: this._dbPort,
            database: this._dbName
        };
    }
}
