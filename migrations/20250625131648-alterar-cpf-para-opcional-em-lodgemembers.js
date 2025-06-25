/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Altera a coluna CPF para permitir valores nulos
    await queryInterface.changeColumn("LodgeMembers", "CPF", {
      type: Sequelize.STRING,
      allowNull: true, // A mudança principal
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte a alteração, tornando a coluna obrigatória novamente
    await queryInterface.changeColumn("LodgeMembers", "CPF", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
