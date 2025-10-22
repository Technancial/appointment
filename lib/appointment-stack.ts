import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqsEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class AppointmentStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // --- 1. DynamoDB: Tabla de Agendamientos ---
        const appointmentTable = new dynamodb.Table(this, 'AppointmentsTable', {
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // INSURED#123
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },     // APPOINTMENT#456
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Auto-escalable
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Cambiar a RETAIN en producción
            tableName: 'AppointmentSchedulerTable',
        });

        // --- 2. SNS: Tópico Único para Notificaciones ---
        const appointmentTopic = new sns.Topic(this, 'AppointmentScheduledTopic', {
            topicName: 'AppointmentScheduledTopic',
            displayName: 'Topic for scheduled appointment events.',
        });

        // --- 3. SQS: Colas con Filtro de País ---

        // Cola para el procesamiento de Chile (CL)
        const chileQueue = new sqs.Queue(this, 'ChileProcessingQueue', {
            queueName: 'ChileAppointmentProcessingQueue',
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // Cola para el procesamiento de Perú (PE)
        const peruQueue = new sqs.Queue(this, 'PeruProcessingQueue', {
            queueName: 'PeruAppointmentProcessingQueue',
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // --- 4. Suscripciones con Filtrado por País ---

        // Suscripción Chile: filtra por el atributo de mensaje 'Country' = 'CL'
        appointmentTopic.addSubscription(new subs.SqsSubscription(chileQueue, {
            filterPolicy: {
                Country: sns.SubscriptionFilter.stringFilter({
                    allowlist: ['CL'],
                }),
            },
            rawMessageDelivery: true, // Recibir el mensaje SNS crudo
        }));

        // Suscripción Perú: filtra por el atributo de mensaje 'Country' = 'PE'
        appointmentTopic.addSubscription(new subs.SqsSubscription(peruQueue, {
            filterPolicy: {
                Country: sns.SubscriptionFilter.stringFilter({
                    allowlist: ['PE'],
                }),
            },
            rawMessageDelivery: true,
        }));

        // --- 5. Lambda: Uso de Imagen Docker del Proyecto Anterior ---

        // Ruta a la carpeta de tu código Lambda/Dockerfile
        //const dockerDirectory = '../02-appointment';

        /*const asset = new assets.DockerImageAsset(this, 'LambdaDockerImage', {
            directory: dockerDirectory,
            platform: assets.Platform.LINUX_AMD64,
        });*/
        const dockerDirectory = path.join(__dirname, '..', '02-appointment');

        // Definición de la función Lambda usando el Container Image
        const schedulerLambda = new lambda.Function(this, 'AppointmentSchedulerLambda', {
            code: lambda.Code.fromAssetImage(dockerDirectory, {
                platform: assets.Platform.LINUX_AMD64,
            }),
            handler: lambda.Handler.FROM_IMAGE, // Indicador para Lambda de Contenedor
            runtime: lambda.Runtime.FROM_IMAGE, // Indicador para Lambda de Contenedor
            environment: {
                APPOINTMENT_TABLE_NAME: appointmentTable.tableName,
                SNS_TOPIC_ARN: appointmentTopic.topicArn, // Pasa el ARN del tópico a la Lambda
                LOG_LEVEL: 'info',
            },
            memorySize: 256,
            timeout: cdk.Duration.seconds(30),
        });

        // --- 6. Permisos IAM ---

        // Dar permiso a la Lambda para leer/escribir en DynamoDB
        appointmentTable.grantReadWriteData(schedulerLambda);

        // Dar permiso a la Lambda para publicar en el Tópico SNS
        appointmentTopic.grantPublish(schedulerLambda);

        // --- 7. API Gateway (Opcional, pero para probar el Non-Proxy) ---

        const api = new apigw.RestApi(this, 'AppointmentApi', {
            restApiName: 'AppointmentSchedulerService',
            deployOptions: {
                stageName: 'v1',
            },
        });

        const appointmentResource = api.root.addResource('appointments');

        // Recurso anidado: /appointments/{id}
        const appointmentIdResource = appointmentResource.addResource('{id}');

        // ---------------------------------------------
        // A. Operación POST /appointments (REGISTER)
        // ---------------------------------------------
        // 💡 Configuración para integración NON-PROXY
        appointmentResource.addMethod('POST', new apigw.LambdaIntegration(schedulerLambda, {
            proxy: false, // CLAVE: Desactiva el proxy para usar el Non-Proxy

            // Mapeo de Petición: Pasa el cuerpo HTTP directamente como el evento JSON de Lambda
            requestTemplates: {
                'application/json': `{
                    "action": "register",
                    "data": $input.json('$')
                }`
            },

            // Mapeo de Respuesta 200: Devuelve la salida JSON de la Lambda directamente
            integrationResponses: [
                {
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': '$input.json("$")'
                    },
                },
                // Mapeo de errores de aplicación (ejemplo)
                {
                    statusCode: '400',
                    selectionPattern: '.*"error":"InvalidCountryError".*', // Captura el error lanzado por la Lambda
                    responseTemplates: {
                        'application/json': JSON.stringify({ message: "Invalid country or data format." }),
                    },
                },
            ],
        }), {
            // Configuración de la respuesta del método HTTP
            methodResponses: [{ statusCode: '200' }, { statusCode: '400' }],
        });

        // ---------------------------------------------
        // B. Operación GET /appointments/{id} (FIND)
        // ---------------------------------------------
        appointmentIdResource.addMethod('GET', new apigw.LambdaIntegration(schedulerLambda, {
            proxy: false,

            // 💡 PLANTILLA VTL PARA GET: Captura el parámetro de la URL
            requestTemplates: {
                // $input.params('id') captura el valor de {id} en la URL
                'application/json': `{
                    "action": "find",
                    "data": "$input.params('id')"
                }`
            },

            // 💡 Respuestas (Ajustar según la estructura de error de tu Lambda)
            integrationResponses: [
                { statusCode: '200', responseTemplates: { 'application/json': '$input.json("$")' } },
                {
                    statusCode: '404', // Usar 404 para "no encontrado"
                    selectionPattern: '.*"error":"AppointmentNotFoundError".*',
                    responseTemplates: { 'application/json': JSON.stringify({ message: "Appointment not found." }) },
                },
            ],
        }), {
            // Se define que el método puede responder con 200 (OK) o 404 (No encontrado)
            methodResponses: [{ statusCode: '200' }, { statusCode: '404' }],
        });

        // 8. usar S3 para almacenar en lugar de un RDS
        const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: false,
        });

        // 9. SQS: Cola de destino para las notificaciones de EventBridge
        const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
            queueName: 'ProcessingNotificationQueue',
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // --- 10. Lambda: Procesador de Colas SQS (Instancia de Código Único) ---

        // Directorio de la nueva aplicación Lambda (asume carpeta '03-processor-app' al nivel de 'infra')
        const processorDockerDirectory = path.join(__dirname, '..', '03-processor-app');

        // La función base: se construye la imagen una sola vez
        const baseProcessorLambdaProps = {
            // SOLUCIÓN ROBUSTA: construye la imagen desde el directorio local y gestiona el tag dinámico.
            code: lambda.Code.fromAssetImage(processorDockerDirectory, {
                platform: assets.Platform.LINUX_AMD64,
            }),
            handler: lambda.Handler.FROM_IMAGE, // Indicador para Lambda de Contenedor
            runtime: lambda.Runtime.FROM_IMAGE, // Indicador para Lambda de Contenedor
            memorySize: 256,
            timeout: cdk.Duration.seconds(30),
            environment: {
                BUCKET_NAME: processedDataBucket.bucketName,
                LOG_LEVEL: 'info',
                EVENT_BUS_NAME: 'default', // Usaremos el bus por defecto de AWS
                DB_SECRET_ARN: 'secretBD',
                DB_HOST: 'hostBD',
                DB_NAME: 'cita'
            },
        };

        // --- 11. Instanciación de las dos Lambdas ---

        // 11a. Lambda para Chile
        const chileProcessorLambda = new lambda.Function(this, 'ChileProcessorLambda', {
            ...baseProcessorLambdaProps,
            functionName: 'ChileProcessorLambda',
            environment: {
                ...baseProcessorLambdaProps.environment,
                // Pasa la variable de entorno SQS_QUEUE_NAME para identificar la fuente (útil para logs/EventBridge)
                SQS_QUEUE_NAME: chileQueue.queueName,
            },
        });

        // 11b. Lambda para Perú
        const peruProcessorLambda = new lambda.Function(this, 'PeruProcessorLambda', {
            ...baseProcessorLambdaProps,
            functionName: 'PeruProcessorLambda',
            environment: {
                ...baseProcessorLambdaProps.environment,
                SQS_QUEUE_NAME: peruQueue.queueName,
            },
        });

        // --- 12. Permisos y Triggers ---

        // Permisos para el Bucket S3: Escribir
        processedDataBucket.grantWrite(chileProcessorLambda);
        processedDataBucket.grantWrite(peruProcessorLambda);

        // Permisos para EventBridge: Publicar eventos
        chileProcessorLambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
            actions: ['events:PutEvents'],
            resources: ['*'], // Se permite publicar en cualquier bus (incluyendo el 'default')
        }));
        peruProcessorLambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
            actions: ['events:PutEvents'],
            resources: ['*'],
        }));

        // Triggers SQS: Conecta la cola a la Lambda correspondiente
        chileProcessorLambda.addEventSource(new sqsEventSources.SqsEventSource(chileQueue));
        peruProcessorLambda.addEventSource(new sqsEventSources.SqsEventSource(peruQueue));

        // --- 13. EventBridge: Regla de Notificación ---

        // Regla que escucha los eventos de éxito de las Lambdas
        const eventBridgeRule = new events.Rule(this, 'S3SaveSuccessRule', {
            eventPattern: {
                source: ['com.appointment.processor'], // Fuente que la Lambda publicará
                detailType: ['DB_SAVE_SUCCESS'], // Tipo de evento para el éxito
            },
            description: 'Routes S3 save success events to the notification queue.',
        });

        // EventBridge Target: Envía el evento completo a la nueva cola SQS
        eventBridgeRule.addTarget(new targets.SqsQueue(notificationQueue));

        schedulerLambda.addEventSource(new sqsEventSources.SqsEventSource(notificationQueue));
    }

}