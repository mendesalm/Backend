// backend/utils/pick.js

/**
 * Cria um objeto contendo apenas as chaves selecionadas de um objeto de origem.
 * @param {Object} object - O objeto de origem.
 * @param {string[]} keys - Um array de strings com as chaves a serem incluídas no novo objeto.
 * @returns {Object} - Um novo objeto contendo apenas as chaves e valores selecionados.
 */
export const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    // Verifica se o objeto de origem existe e se a chave é uma propriedade própria do objeto
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // Atribui o valor da chave ao novo objeto
      // A desabilitação do lint é para o caso específico de reatribuição em 'obj' dentro do reduce.
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

// Se você tivesse múltiplas funções para exportar deste arquivo, poderia fazer:
// export { pick, outraFuncao, maisUmaFuncao };
// Ou exportar cada uma individualmente como acima.