import { DataSource } from 'typeorm';
import { AppointmentDetailsDB } from './message.entity';
import 'reflect-metadata';
import * as AWS from 'aws-sdk';

let dataSource: DataSource;

export async function getDataSource(): Promise<DataSource> {
    if (dataSource && dataSource.isInitialized) {
        return dataSource;
    }

    const sm = new AWS.SecretsManager();

    const secretArn = process.env.DB_SECRET_ARN;
    const dbHost = process.env.DB_HOST;
    const dbName = process.env.DB_NAME;

    if (!secretArn || !dbHost || !dbName) {
        throw new Error("Missing required database environment variables.");
    }

    let credentials: any;

    try {
        // Obtener el valor del secreto
        const secretData = await sm.getSecretValue({ SecretId: secretArn }).promise();

        if (secretData.SecretString) {
            credentials = JSON.parse(secretData.SecretString);
        } else {
            throw new Error("Secret string is missing or empty.");
        }
    } catch (error) {
        console.error("ERROR: Failed to retrieve credentials from Secrets Manager.", error);
        throw new Error("Failed to load database credentials.");
    }

    // Configuración del DataSource
    dataSource = new DataSource({
        type: 'mysql',
        host: dbHost,
        port: parseInt(process.env.DB_PORT || '3306'),

        // 💡 Credenciales seguras
        username: credentials.username,
        password: credentials.password,

        database: dbName,
        synchronize: false, // Debe ser 'false' si usas migraciones o tienes la tabla creada por scripts
        logging: ['error'],
        entities: [AppointmentDetailsDB], // 💡 Usar la nueva entidad

        extra: {
            connectionLimit: 2,
        }
    });

    await dataSource.initialize();
    return dataSource;
}