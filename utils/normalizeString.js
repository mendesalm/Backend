// utils/normalizeString.js
export const normalizeString = (str) => {
  // Retorna a string em minúsculas, sem espaços no início/fim e com espaços internos reduzidos a um.
  // Retorna uma string vazia se a entrada for nula ou indefinida para evitar erros.
  return str ? str.toLowerCase().trim().replace(/\s+/g, " ") : "";
};
