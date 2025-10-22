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
|--------|-------------|
| npm install | Instala las dependencias de AWS CDK. |
| cdk synth | Sintetiza la plantilla de CloudFormation (solo verifica). |
| cdk deploy | Construye los Docker Assets, los sube a ECR y crea todos los recursos de AWS. |

3. **Documentación de Uso (API Gateway)**
   La API Gateway está configurada con Integración Non-Proxy, lo que significa que el cuerpo de la petición HTTP se envuelve en un payload uniforme para la Lambda: { "action": "...", "data": "..." }.

   _URL_ Base: https://sszycq4t16.execute-api.us-east-1.amazonaws.com/v1

   _POST_: Agendar una Cita (action: "register")
   Inicia el proceso asíncrono. La Lambda 02-appointment envuelve tu payload en ```{"action": "register", "data": ...}```.

   _URL_: POST URL_Base/appointments

   **Validaciones:**
   - `insuredId`: String de exactamente 5 caracteres
   - `scheduleId`: Número entero positivo (> 0)
   - `countryISO`: Solo "PE" o "CL" (case-insensitive)
   - `centerId`, `specialtyId`, `medicId`: Números enteros positivos (> 0)
   - `date`: Formato ISO 8601 válido

   Ejemplo de Petición (Cuerpo JSON):
   ```json
   {
    "insuredId": "12354",
    "scheduleId": 98701,
    "countryISO": "PE",
    "centerId": 101,
    "specialtyId": 105,
    "medicId": 201,
    "date": "2025-10-25T10:00:00Z"
    }
    ```
   **Respuesta de Éxito (200 OK)**:
   ```json
    {
        "message": "cita para PE recibido y en proceso.",
        "id": "98701"
    }
    ```

   **Respuesta de Error (400 Bad Request)**:
   ```json
    {
        "error": "InvalidInsuredIdError",
        "message": "InsuredId debe tener exactamente 5 caracteres",
        "errorCode": "INVALID_INSURED_ID"
    }
    ```

    _GET_: Consultar Citas por Asegurado (action: "find")
    La Lambda 02-appointment envuelve tu ID de URL en ```{"action": "find", "data": "ID_DEL_ASEGURADO"}```.

    _URL_: GET URL_Base/appointments/{insuredId}

    **Validaciones:**
    - `insuredId`: String de exactamente 5 caracteres (en el path)

    Ejemplo de Petición (cURL):
    ```bash
    # Reemplaza [URL_BASE] y el ID (debe ser 5 caracteres)
    curl -X GET [URL_BASE]/appointments/12389
    ```
    **Respuesta de Éxito (200 OK)**:
    Devuelve un array con todas las citas encontradas para el insuredId.
    ```json
    [
        {
            "insuredId": "12389",
            "countryId": "PE",
            "scheduleId": 98706,
            "centerId": 101,
            "specialtyId": 105,
            "medicId": 201,
            "date": "2025-10-22T10:00:00Z",
            "estado": "pending"
        }
    ]
    ```

    **Respuesta con Array Vacío (200 OK)**:
    ```json
    []
    ```

## Especificación Swagger/OpenAPI

A continuación se presenta la especificación OpenAPI 3.0 para los endpoints del microservicio de agendamiento:

```yaml
openapi: 3.0.0
info:
  title: API de Agendamiento Médico
  description: Microservicio para gestión de citas médicas utilizando arquitectura serverless en AWS
  version: 1.0.0
  contact:
    name: Equipo de Desarrollo
servers:
  - url: https://sszycq4t16.execute-api.us-east-1.amazonaws.com/v1
    description: Servidor de Producción

paths:
  /appointments:
    post:
      summary: Registrar una nueva cita médica
      description: Inicia el proceso asíncrono de agendamiento de una cita médica. La petición se envuelve internamente con la acción "register".
      operationId: registerAppointment
      tags:
        - Agendamiento
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ScheduleAppointmentRequest'
            example:
              insuredId: "12354"
              scheduleId: 98701
              countryISO: "PE"
              centerId: 101
              specialtyId: 105
              medicId: 201
              date: "2025-10-25T10:00:00Z"
      responses:
        '200':
          description: Cita recibida y en proceso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ScheduleAppointmentResponse'
              example:
                message: "cita para PE recibido y en proceso."
                id: "98701"
        '400':
          description: Petición inválida
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Error interno del servidor
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /appointments/{insuredId}:
    get:
      summary: Consultar citas por ID de asegurado
      description: Obtiene todas las citas asociadas a un asegurado específico. La petición se envuelve internamente con la acción "find".
      operationId: findAppointments
      tags:
        - Consultas
      parameters:
        - name: insuredId
          in: path
          required: true
          description: Identificador único del asegurado (exactamente 5 caracteres)
          schema:
            type: string
            minLength: 5
            maxLength: 5
            pattern: '^.{5}$'
          example: "12389"
      responses:
        '200':
          description: Lista de citas encontradas
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Appointment'
              example:
                - insuredId: "12389"
                  countryId: "PE"
                  scheduleId: 98706
                  centerId: 101
                  specialtyId: 105
                  medicId: 201
                  date: "2025-10-22T10:00:00Z"
                  estado: "pending"
        '404':
          description: No se encontraron citas para el asegurado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Error interno del servidor
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    ScheduleAppointmentRequest:
      type: object
      required:
        - insuredId
        - scheduleId
        - countryISO
        - centerId
        - specialtyId
        - medicId
        - date
      properties:
        insuredId:
          type: string
          description: Identificador único del asegurado (exactamente 5 caracteres)
          minLength: 5
          maxLength: 5
          pattern: '^.{5}$'
          example: "12354"
        scheduleId:
          type: integer
          description: Identificador de la agenda/horario (número entero positivo)
          minimum: 1
          example: 98701
        countryISO:
          type: string
          description: Código ISO del país (solo PE o CL aceptados, case-insensitive)
          enum: [PE, CL, pe, cl]
          pattern: '^[A-Za-z]{2}$'
          example: "PE"
        centerId:
          type: integer
          description: Identificador del centro médico (número entero positivo)
          minimum: 1
          example: 101
        specialtyId:
          type: integer
          description: Identificador de la especialidad médica (número entero positivo)
          minimum: 1
          example: 105
        medicId:
          type: integer
          description: Identificador del médico (número entero positivo)
          minimum: 1
          example: 201
        date:
          type: string
          format: date-time
          description: Fecha y hora de la cita en formato ISO 8601 (validado estrictamente)
          pattern: '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$'
          example: "2025-10-25T10:00:00Z"

    ScheduleAppointmentResponse:
      type: object
      properties:
        message:
          type: string
          description: Mensaje de confirmación del procesamiento
          example: "cita para PE recibido y en proceso."
        id:
          type: string
          description: Identificador de la cita creada
          example: "98701"

    Appointment:
      type: object
      properties:
        insuredId:
          type: string
          description: Identificador del asegurado (5 caracteres)
          minLength: 5
          maxLength: 5
          example: "12389"
        scheduleId:
          type: integer
          description: Identificador de la agenda (número entero positivo)
          minimum: 1
          example: 98706
        countryId:
          type: string
          description: Código del país (PE o CL en mayúsculas)
          enum: [PE, CL]
          example: "PE"
        centerId:
          type: integer
          description: Identificador del centro médico (número entero positivo)
          minimum: 1
          example: 101
        specialtyId:
          type: integer
          description: Identificador de la especialidad médica (número entero positivo)
          minimum: 1
          example: 105
        medicId:
          type: integer
          description: Identificador del médico (número entero positivo)
          minimum: 1
          example: 201
        date:
          type: string
          format: date-time
          description: Fecha y hora de la cita en formato ISO 8601
          example: "2025-10-22T10:00:00Z"
        estado:
          type: string
          description: Estado actual de la cita
          enum: [pending, confirmed, cancelled, completed]
          example: "pending"

    Error:
      type: object
      properties:
        error:
          type: string
          description: Tipo o nombre del error de dominio
          enum:
            - InvalidInsuredIdError
            - InvalidScheduleIdError
            - InvalidCountryError
            - InvalidDateError
            - InvalidAppointmentStatusError
            - InvalidCenterIdError
            - InvalidSpecialtyIdError
            - InvalidMedicIdError
            - RepositoryError
            - NotificationError
          example: "InvalidInsuredIdError"
        message:
          type: string
          description: Descripción detallada del error con contexto
          example: "InsuredId debe tener exactamente 5 caracteres"
        errorCode:
          type: string
          description: Código único del error para debugging y tracking
          enum:
            - INVALID_INSURED_ID
            - INVALID_SCHEDULE_ID
            - INVALID_COUNTRY
            - INVALID_DATE
            - INVALID_APPOINTMENT_STATUS
            - INVALID_CENTER_ID
            - INVALID_SPECIALTY_ID
            - INVALID_MEDIC_ID
            - REPOSITORY_ERROR
            - NOTIFICATION_ERROR
            - UNKNOWN_ERROR
          example: "INVALID_INSURED_ID"
```

### Uso de la Especificación Swagger

Para visualizar y probar la API utilizando la especificación Swagger:

1. **Swagger Editor Online**: Copia el contenido YAML anterior y pégalo en [editor.swagger.io](https://editor.swagger.io)

2. **Swagger UI Local**:
   ```bash
   # Instalar http-server globalmente
   npm install -g http-server

   # Guardar la especificación en swagger.yaml
   # Descargar Swagger UI desde https://github.com/swagger-api/swagger-ui/releases
   # Reemplazar el archivo petstore.yaml con tu swagger.yaml
   # Iniciar el servidor
   http-server swagger-ui-dist/
   ```

3. **Postman**: Importa el archivo YAML directamente en Postman para generar una colección de pruebas.

4. **Generación de Clientes**: Utiliza [Swagger Codegen](https://swagger.io/tools/swagger-codegen/) para generar SDKs en diferentes lenguajes:
   ```bash
   swagger-codegen generate -i swagger.yaml -l typescript-fetch -o ./client
   ```
