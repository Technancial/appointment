FROM public.ecr.aws/bitnami/node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev
RUN npm install typescript

COPY src ./src
COPY tsconfig.json .

RUN npm run build

FROM public.ecr.aws/lambda/nodejs:22

# Copiar dependencias de producción y código transpilado desde la etapa de compilación
COPY --from=build /app/node_modules /var/task/node_modules
COPY --from=build /app/dist/main.js /var/task/index.js

# Especificar el handler de Lambda: [nombre_archivo_js].[nombre_función_exportada]
# En este caso, index.js (dist/index.js) y la función 'handler'
CMD [ "index.handler" ]