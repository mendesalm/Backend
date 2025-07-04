// models/emprestimo.model.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Emprestimo = sequelize.define(
    "Emprestimo",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      livroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Biblioteca", key: "id" },
      },
      membroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "LodgeMembers", key: "id" },
      },
      dataEmprestimo: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Alterado: Permite nulo até a aprovação
      },
      dataDevolucaoPrevista: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Alterado: Permite nulo até a aprovação
      },
      dataDevolucaoReal: { type: DataTypes.DATEONLY, allowNull: true },

      // CAMPO ADICIONADO: Controla o ciclo de vida do empréstimo no banco de dados.
      status: {
        type: DataTypes.ENUM(
          "solicitado",
          "aprovado",
          "rejeitado",
          "devolvido"
        ),
        allowNull: false,
        defaultValue: "solicitado",
      },

      // O campo VIRTUAL foi renomeado para 'statusCalculado' para evitar conflito
      // e continua a fornecer uma visão dinâmica e amigável para o frontend.
      statusCalculado: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.status === "devolvido") return "Devolvido";
          if (this.status === "rejeitado") return "Rejeitado";
          if (this.status === "solicitado") return "Solicitado";

          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const devolucaoPrevista = this.dataDevolucaoPrevista
            ? new Date(this.dataDevolucaoPrevista)
            : null;

          if (devolucaoPrevista && hoje > devolucaoPrevista) {
            return "Atrasado";
          }
          return "Emprestado"; // Corresponde ao status 'aprovado'
        },
      },
    },
    {
      tableName: "Emprestimos",
      timestamps: true,
      hooks: {
        // REMOVIDO: O hook afterCreate não deve mais alterar o status do livro,
        // pois a criação agora é apenas uma solicitação. A alteração de status
        // do livro ocorrerá no endpoint de aprovação.

        // Hook AFTER a loan is updated
        afterUpdate: async (emprestimo, options) => {
          // A lógica agora é acionada quando o status muda para 'devolvido'
          if (
            emprestimo.dataValues.status === "devolvido" &&
            emprestimo._previousDataValues.status !== "devolvido"
          ) {
            const Livro = sequelize.models.Biblioteca;

            try {
              // Importa dinamicamente para evitar dependências circulares
              const { notificarProximoDaFila } = await import(
                "../services/notification.service.js"
              );

              // Tenta notificar o próximo da fila de reserva
              const notificado = await notificarProximoDaFila(
                emprestimo.livroId,
                sequelize.models
              );

              // Se ninguém foi notificado (não havia reservas), o livro fica 'Disponível'
              if (!notificado) {
                await Livro.update(
                  { status: "Disponível" },
                  {
                    where: { id: emprestimo.livroId },
                    transaction: options.transaction,
                  }
                );
              }
            } catch (error) {
              console.error(
                `[Hook afterUpdate Emprestimo] Falha ao processar a fila de reserva para o livro ID ${emprestimo.livroId}. Erro:`,
                error
              );

              // LÓGICA DE FALLBACK: Garante que o livro volte a ficar disponível se a notificação falhar.
              await Livro.update(
                { status: "Disponível" },
                {
                  where: { id: emprestimo.livroId },
                  transaction: options.transaction,
                }
              );
            }
          }
        },

        // Hook BEFORE a loan is destroyed (in case you allow deleting active loans)
        beforeDestroy: async (emprestimo, options) => {
          // Apenas muda o status do livro se o empréstimo deletado estava ativo ('aprovado')
          if (emprestimo.status === "aprovado") {
            const Livro = sequelize.models.Biblioteca;
            await Livro.update(
              { status: "Disponível" },
              {
                where: { id: emprestimo.livroId },
                transaction: options.transaction,
              }
            );
          }
        },
      },
    }
  );

  Emprestimo.associate = (models) => {
    Emprestimo.belongsTo(models.Biblioteca, {
      foreignKey: "livroId",
      as: "livro",
    });
    Emprestimo.belongsTo(models.LodgeMember, {
      foreignKey: "membroId",
      as: "membro",
    });
  };

  return Emprestimo;
};
