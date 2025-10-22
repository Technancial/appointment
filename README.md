# Microservicio de Agendamiento Médico (Clean Architecture + Serverless)
Este proyecto implementa un backend de agendamiento de citas médicas utilizando AWS Serverless, TypeScript, Arquitectura Limpia/Hexagonal y contenedores Docker para las funciones Lambda.

La arquitectura sigue un patrón de Orquestación Asíncrona para el procesamiento de citas por país, garantizando escalabilidad y desacoplamiento.

## Arquitectura del Proyecto
El proyecto se compone de tres componentes principales:

**infra**: Define todos los recursos de AWS usando AWS CDK.

**02-appointment**: Microservicio principal (Adaptador HTTP) que recibe y despacha peticiones POST (registro) y GET (búsqueda).

**03-processor-app**: Microservicio asíncrono (Adaptador SQS) que procesa los eventos de agendamiento y los persiste en S3.
![Arquitectura](/image/appointment.jpg)

|Recursos|Tipo|Propósito|
|--------|----|---------|
|API Gateway|REST API|Punto de entrada público (Non-Proxy) para POST /appointments y GET /appointments/{id}.|
|Lambda 02-appointment|Docker Container|Lógica sincrónica de registro/búsqueda. Publica eventos a SNS.|
|SNS AppointmentScheduledTopic|Tópico|Canal de eventos para el registro de citas.|
|SQS *ProcessingQueue| Colas de Trabajo | Dos colas suscritas a SNS con filtros por Country (PE, CL).|
|Lambda 03-processor-ap| Docker Container (x2) | Consume las colas SQS (PE y CL). Persiste el contenido en S3.|
|EventBridge | Bus de Eventos | Recibe notificaciones de 03-processor-app sobre el éxito del guardado en S3.|
|SQS NotificationQueue| Cola de Notificación | Recibe eventos de EventBridge para procesamiento posterior.|

# Despliegue y Uso
1. **Requisitos Previos**
Node.js (v18 o superior)

AWS CLI configurado y autenticado.

AWS CDK CLI instalado globalmente (npm install -g aws-cdk).

Docker Desktop (o motor compatible) en ejecución.

CDK Bootstrapping completado en la región de destino (cdk bootstrap).

2. **Despliegue de Infraestructura**
Todos los comandos se ejecutan desde el directorio infra/.

|Comando | Descripción |
| npm install | Instala las dependencias de AWS CDK. |
| cdk synth | Sintetiza la plantilla de CloudFormation (solo verifica). |
| cdk deploy | Construye los Docker Assets, los sube a ECR y crea todos los recursos de AWS. |

3. **Documentación de Uso (API Gateway)**
   La API Gateway está configurada con Integración Non-Proxy, lo que significa que el cuerpo de la petición HTTP se envuelve en un payload uniforme para la Lambda: { "action": "...", "data": "..." }.

   _URL_ Base: https://sszycq4t16.execute-api.us-east-1.amazonaws.com/v1

   _POST_: Agendar una Cita (action: "register")
   Inicia el proceso asíncrono. La Lambda 02-appointment envuelve tu payload en ```{"action": "register", "data": ...}```.

   _URL_: POST URL_Base/appointments
   Ejemplo de Petición (Cuerpo JSON):
   ```
   {
    "insuredId": "12354",
    "scheduleId": "98701",
    "countryISO": "PE",
    "centerId": "101",
    "specialtyId": "105",
    "medicId": "201",
    "date": "2025-10-25T10:00:00Z"
    }
    ```
   **Respuesta de Éxito (200 OK)**:
   ```
    {
        "message": "cita para PE recibido y en proceso.",
        "id": "98701"
    }
    ```

    _GET_: Consultar Citas por Asegurado (action: "find")
    La Lambda 02-appointment envuelve tu ID de URL en ```{"action": "find", "data": "ID_DEL_ASEGURADO"}```.

    _URL_: GET URL_Base/appointments/{insuredId}
    Ejemplo de Petición (cURL):
    ```
    # Reemplaza [URL_BASE] y el ID
    curl -X GET [URL_BASE]/appointments/00123
    ```
    **Respuesta de Éxito (200 OK)**:
    Devuelve un array con todas las citas encontradas para el insuredId.
    ```
    [
        {
            "insuredId": "00123",
            "scheduleId": 987,
            "countryId": "PE",
            "date": "2025-11-20T08:00:00Z",
            "estado": "pending" 
        },
    // ... más citas
    ]
    ```
