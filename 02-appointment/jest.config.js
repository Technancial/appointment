module.exports = {
  // Entorno de prueba: node es el runtime de Lambda
  testEnvironment: 'node',

  // 💡 Transformador: Usa ts-jest para manejar archivos .ts
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Directorios de búsqueda de pruebas (busca en la carpeta 'tests')
  testMatch: [
    "**/tests/**/*.test.ts"
  ],

  // Extensiones de archivos a buscar
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // 💡 CONFIGURACIÓN CLAVE PARA RESOLVER ALIAS DE PATHS (@domain, etc.)
  // Le dice a ts-jest que use el tsconfig.json para resolver los alias
  moduleNameMapper: {
    // Esto asegura que Jest resuelva el alias "@domain" a la ruta correcta ("./src/domain")
    // Usamos el tsconfig.json para que sea la fuente única de verdad
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  },

  // 💡 Ruta al archivo tsconfig.json de pruebas (ver sección 3)
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json', 
    },
  },
  
  // Opciones de cobertura (opcional)
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage',
};