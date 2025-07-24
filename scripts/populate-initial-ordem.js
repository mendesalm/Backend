import db from "../models/index.js";

const populateInitialOrdem = async () => {
  const transaction = await db.sequelize.transaction();
  try {
    const responsabilidades = await db.ResponsabilidadeJantar.findAll({
      where: { status: "Ativo" },
      include: [
        {
          model: db.LodgeMember,
          as: "membro",
          attributes: ["NomeCompleto"],
        },
      ],
      order: [[{ model: db.LodgeMember, as: "membro" }, "NomeCompleto", "ASC"]],
      transaction,
    });

    for (let i = 0; i < responsabilidades.length; i++) {
      const responsabilidade = responsabilidades[i];
      await responsabilidade.update({ ordem: i + 1 }, { transaction });
    }

    await transaction.commit();
    console.log("Initial 'ordem' populated successfully.");
  } catch (error) {
    await transaction.rollback();
    console.error("Error populating initial 'ordem':", error);
  }
};

populateInitialOrdem();
