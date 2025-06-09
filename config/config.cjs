// config/config.cjs
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis do arquivo .env localizado na raiz do projeto
// Assumindo que a pasta 'config' está dentro de 'backend', e 'backend' está na raiz do projeto.
// Se a estrutura for SysJPJ/backend/config, o path '../../.env' aponta para SysJPJ/.env. Ajuste se necessário.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306 // Adicionar a porta do .env também
  },
  test: {
    // Melhor prática: Usar variáveis de ambiente separadas para o banco de testes
    // Ex: TEST_DB_USER, TEST_DB_PASS, TEST_DB_NAME
    // Por enquanto, vamos usar as mesmas do desenvolvimento conforme seu arquivo original.
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306
  },
  production: {
    // Melhor prática: Usar variáveis de ambiente separadas e mais seguras para produção
    // Ex: PROD_DB_USER, PROD_DB_PASS, PROD_DB_HOST, PROD_DB_NAME
    // Por enquanto, vamos usar as mesmas do desenvolvimento conforme seu arquivo original.
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306
  }
};