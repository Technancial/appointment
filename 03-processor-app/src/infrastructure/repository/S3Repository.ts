import { IS3Repository, ProcessedMessage } from '@domain/entities';
import { ILogger } from '@domain/Logger';
import { S3 } from 'aws-sdk';

export class S3Repository implements IS3Repository {
    private s3 = new S3();
    private bucketName: string;

    constructor(private logger: ILogger) {
        // Obtenido de la variable de entorno del CDK
        this.bucketName = process.env.BUCKET_NAME!;
    }

    async save(message: ProcessedMessage): Promise<string> {
        this.logger.info(`RepositoryS3 message: ${JSON.stringify(message)}`);

        const date = new Date(message.timestamp).toISOString().split('T')[0];
        this.logger.info(`date: ${date}`);

        const key = `${message.queueSource}/${date}/${message.id}.json`;
        this.logger.info(`key: ${key}`);

        await this.s3.putObject({
            Bucket: this.bucketName,
            Key: key,
            Body: JSON.stringify(message.data),
            ContentType: 'application/json',
        }).promise();

        return key;
    }
}