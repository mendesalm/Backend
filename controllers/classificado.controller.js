// controllers/classificado.controller.js
import db from "../models/index.js";
import fs from "fs";
import path from "path";

// Helper para remover arquivos físicos de forma segura
const removerArquivoFisico = (caminhoRelativo) => {
  if (!caminhoRelativo) return;
  const caminhoAbsoluto = path.resolve(caminhoRelativo);
  fs.unlink(caminhoAbsoluto, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`Erro ao deletar arquivo físico ${caminhoAbsoluto}:`, err);
    }
  });
};

// Helper para verificar permissão (Dono do anúncio ou Admin)
const isOwnerOrAdmin = (user, classificado) => {
  if (!user || !classificado) return false;
  // Verifica se a credencial do usuário é 'Admin'
  if (user.credencialAcesso === "Admin") return true;
  // Verifica se o ID do usuário é o mesmo do criador do classificado
  return user.id === classificado.lodgeMemberId;
};

/**
 * Cria um novo classificado com múltiplas fotos.
 */
export const createClassificado = async (req, res) => {
  const t = await db.sequelize.transaction(); // Inicia uma transação
  try {
    const { titulo, descricao, tipoAnuncio, valor, contato } = req.body;
    const lodgeMemberId = req.user.id;

    // 1. Cria o registro do classificado
    const novoClassificado = await db.Classificado.create(
      {
        titulo,
        descricao,
        tipoAnuncio,
        valor: valor || null,
        contato,
        lodgeMemberId,
      },
      { transaction: t }
    );

    // 2. Se houver fotos, cria os registros para elas
    if (req.files && req.files.length > 0) {
      const fotosParaSalvar = req.files.map((file) => {
        const caminhoRelativo = path
          .join("uploads", "classificados", file.filename)
          .replace(/\\/g, "/");
        return {
          caminhoArquivo: caminhoRelativo,
          classificadoId: novoClassificado.id,
        };
      });
      await db.FotoClassificado.bulkCreate(fotosParaSalvar, { transaction: t });
    }

    // 3. Se tudo deu certo, confirma a transação
    await t.commit();

    // Busca o classificado completo com as fotos para retornar
    const resultadoFinal = await db.Classificado.findByPk(novoClassificado.id, {
      include: [{ model: db.FotoClassificado, as: "fotos" }],
    });

    res
      .status(201)
      .json({ message: "Anúncio criado com sucesso!", data: resultadoFinal });
  } catch (error) {
    // 4. Se algo deu errado, desfaz a transação
    await t.rollback();

    // E remove os arquivos que foram upados fisicamente
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => removerArquivoFisico(file.path));
    }

    console.error("Erro ao criar classificado:", error);
    res.status(500).json({
      message: "Erro interno ao criar classificado.",
      errorDetails: error.message,
    });
  }
};

/**
 * Lista todos os classificados.
 */
export const getAllClassificados = async (req, res) => {
  try {
    const classificados = await db.Classificado.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: db.LodgeMember,
          as: "anunciante",
          attributes: ["id", "NomeCompleto", "FotoPessoal_Caminho"],
        },
        {
          model: db.FotoClassificado,
          as: "fotos",
          attributes: ["id", "caminhoArquivo"],
        },
      ],
    });
    res.status(200).json(classificados);
  } catch (error) {
    console.error("Erro ao listar classificados:", error);
    res.status(500).json({
      message: "Erro interno ao listar classificados.",
      errorDetails: error.message,
    });
  }
};

/**
 * Busca um classificado pelo ID.
 */
export const getClassificadoById = async (req, res) => {
  try {
    const classificado = await db.Classificado.findByPk(req.params.id, {
      include: [
        {
          model: db.LodgeMember,
          as: "anunciante",
          attributes: ["id", "NomeCompleto", "FotoPessoal_Caminho"],
        },
        {
          model: db.FotoClassificado,
          as: "fotos",
          attributes: ["id", "caminhoArquivo"],
        },
      ],
    });
    if (!classificado)
      return res.status(404).json({ message: "Anúncio não encontrado." });
    res.status(200).json(classificado);
  } catch (error) {
    console.error("Erro ao buscar classificado:", error);
    res.status(500).json({
      message: "Erro interno ao buscar classificado.",
      errorDetails: error.message,
    });
  }
};

/**
 * Deleta um classificado.
 */
export const deleteClassificado = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const classificado = await db.Classificado.findByPk(req.params.id, {
      include: [{ model: db.FotoClassificado, as: "fotos" }],
    });
    if (!classificado) {
      return res.status(404).json({ message: "Anúncio não encontrado." });
    }

    // --- Verificação de Permissão ---
    if (!isOwnerOrAdmin(req.user, classificado)) {
      return res
        .status(403)
        .json({
          message:
            "Acesso negado. Você não tem permissão para deletar este anúncio.",
        });
    }

    // 1. Remove os arquivos físicos das fotos
    if (classificado.fotos && classificado.fotos.length > 0) {
      classificado.fotos.forEach((foto) =>
        removerArquivoFisico(foto.caminhoArquivo)
      );
    }

    // 2. Deleta o registro do classificado (e as fotos associadas, devido ao onDelete: 'CASCADE')
    await classificado.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ message: "Anúncio deletado com sucesso." });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao deletar classificado:", error);
    res.status(500).json({
      message: "Erro interno ao deletar classificado.",
      errorDetails: error.message,
    });
  }
};

/**
 * Atualiza um classificado. (Versão simplificada)
 * Para uma versão mais complexa, seria necessário gerenciar fotos a serem adicionadas/removidas.
 */
export const updateClassificado = async (req, res) => {
  try {
    const classificado = await db.Classificado.findByPk(req.params.id);
    if (!classificado) {
      return res.status(404).json({ message: "Anúncio não encontrado." });
    }

    // --- Verificação de Permissão ---
    if (!isOwnerOrAdmin(req.user, classificado)) {
      return res
        .status(403)
        .json({
          message:
            "Acesso negado. Você não tem permissão para editar este anúncio.",
        });
    }

    const { titulo, descricao, tipoAnuncio, valor, contato } = req.body;
    await classificado.update({
      titulo,
      descricao,
      tipoAnuncio,
      valor,
      contato,
    });

    // Nota: Esta versão simplificada não gerencia a atualização de fotos.
    // Uma implementação completa poderia receber um array de IDs de fotos a serem deletadas
    // e novos arquivos de fotos a serem adicionados.

    res
      .status(200)
      .json({ message: "Anúncio atualizado com sucesso!", data: classificado });
  } catch (error) {
    console.error("Erro ao atualizar classificado:", error);
    res
      .status(500)
      .json({
        message: "Erro interno ao atualizar classificado.",
        errorDetails: error.message,
      });
  }
};
