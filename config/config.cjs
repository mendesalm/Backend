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
    port: process.env.DB_PORT || 3306,
    timezone: '-03:00', // Define o fuso horário para o Brasil
    dialectOptions: {
      useUTC: false, // Para MySQL, garante que as datas sejam tratadas como locais
    },
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306,
    timezone: '-03:00',
    dialectOptions: {
      useUTC: false,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306,
    timezone: '-03:00',
    dialectOptions: {
      useUTC: false,
    },
  }
};