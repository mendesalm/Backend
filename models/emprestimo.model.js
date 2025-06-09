// models/emprestimo.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Emprestimo = sequelize.define(
    'Emprestimo',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      livroId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Biblioteca', key: 'id' } },
      membroId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'LodgeMembers', key: 'id' } },
      dataEmprestimo: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
      dataDevolucaoPrevista: { type: DataTypes.DATEONLY, allowNull: false },
      dataDevolucaoReal: { type: DataTypes.DATEONLY, allowNull: true }, // Nulo significa que está emprestado
      status: {
        type: DataTypes.VIRTUAL, // Este campo é calculado, não existe no banco de dados
        get() {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
          const devolucaoPrevista = new Date(this.dataDevolucaoPrevista);

          if (this.dataDevolucaoReal) {
            return 'Devolvido';
          }
          if (hoje > devolucaoPrevista) {
            return 'Atrasado';
          }
          return 'Emprestado';
        },
      },
    },
    {
      tableName: 'Emprestimos',
      timestamps: true,
      hooks: {
        // Hook AFTER a new loan is created
        afterCreate: async (emprestimo, options) => {
          const Livro = sequelize.models.Biblioteca;
          await Livro.update(
            { status: 'Emprestado' },
            { where: { id: emprestimo.livroId }, transaction: options.transaction }
          );
        },
        // Hook AFTER a loan is updated
        afterUpdate: async (emprestimo, options) => {
          // Se o livro foi devolvido (dataDevolucaoReal foi preenchida)
          if (emprestimo.dataValues.dataDevolucaoReal !== emprestimo._previousDataValues.dataDevolucaoReal && emprestimo.dataValues.dataDevolucaoReal !== null) {
            // Importa dinamicamente para evitar dependências circulares
            const { notificarProximoDaFila } = await import('../services/notification.service.js');
            // Tenta notificar o próximo da fila de reserva
            const notificado = await notificarProximoDaFila(emprestimo.livroId, sequelize.models);
            
            // Se ninguém foi notificado (não havia reservas), o livro fica 'Disponível'
            if (!notificado) {
              const Livro = sequelize.models.Biblioteca;
              await Livro.update(
                { status: 'Disponível' },
                { where: { id: emprestimo.livroId }, transaction: options.transaction }
              );
            }
          }
        },
        // Hook BEFORE a loan is destroyed (in case you allow deleting active loans)
        beforeDestroy: async (emprestimo, options) => {
             if (emprestimo.dataDevolucaoReal === null) {
                // Se o empréstimo está sendo deletado enquanto ativo, o livro volta a ser disponível
                const Livro = sequelize.models.Biblioteca;
                await Livro.update(
                    { status: 'Disponível' },
                    { where: { id: emprestimo.livroId }, transaction: options.transaction }
                );
             }
        }
      },
    }
  );

  Emprestimo.associate = (models) => {
    Emprestimo.belongsTo(models.Biblioteca, { foreignKey: 'livroId', as: 'livro' });
    Emprestimo.belongsTo(models.LodgeMember, { foreignKey: 'membroId', as: 'membro' });
  };

  return Emprestimo;
};
