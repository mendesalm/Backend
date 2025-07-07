'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [members] = await queryInterface.sequelize.query(
        'SELECT id, `Telefone` FROM `LodgeMembers` WHERE `Telefone` IS NOT NULL',
        { transaction }
      );

      for (const member of members) {
        const phone = member.Telefone;
        if (phone) {
          const onlyDigits = phone.replace(/\D/g, '');
          let formattedPhone = null;

          if (onlyDigits.length === 11) {
            formattedPhone = `(${onlyDigits.substring(0, 2)}) ${onlyDigits.substring(2, 7)}-${onlyDigits.substring(7)}`;
          } else if (onlyDigits.length === 10) {
            formattedPhone = `(${onlyDigits.substring(0, 2)}) ${onlyDigits.substring(2, 6)}-${onlyDigits.substring(6)}`;
          }

          // Only update if the format has changed and is valid
          if (formattedPhone && formattedPhone !== phone) {
            await queryInterface.sequelize.query(
              'UPDATE `LodgeMembers` SET `Telefone` = :phone WHERE id = :id',
              {
                replacements: { phone: formattedPhone, id: member.id },
                transaction,
              }
            );
          }
        }
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('A reversão desta migração (desfazer a formatação de telefone) não é suportada.');
    return Promise.resolve();
  }
};