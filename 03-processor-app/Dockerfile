FROM public.ecr.aws/bitnami/node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY tsconfig.json .

# Ejecutar el bundler para resolver alias y crear el bundle único
RUN npx esbuild src/infrastructure/handler.ts --bundle --outfile=dist/index.js --platform=node --target=node22 --external:aws-sdk

FROM public.ecr.aws/lambda/nodejs:22

# Copiar solo las dependencias de producción y el bundle
COPY --from=build /app/node_modules /var/task/node_modules
COPY --from=build /app/dist/index.js /var/task/index.js 

# Especificar el handler: index.js y la función 'handler'
CMD [ "index.handler" ]