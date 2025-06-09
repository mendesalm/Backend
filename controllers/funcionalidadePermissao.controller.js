import db from '../models/index.js';
// NÃO FAÇA ISSO NO TOPO DO MÓDULO:
// const FuncionalidadePermissao = db.FuncionalidadePermissao;

// Listar todas as funcionalidades e suas permissões
export const getAllFuncionalidadePermissoes = async (req, res) => {
  try {
    // Acesse o modelo diretamente de 'db' AQUI DENTRO
    if (!db.FuncionalidadePermissao) {
      console.error("[getAllFuncionalidadePermissoes] Modelo FuncionalidadePermissao não disponível em db.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo de permissão não inicializado." });
    }
    const permissoes = await db.FuncionalidadePermissao.findAll({
      order: [['nomeFuncionalidade', 'ASC']],
    });
    res.status(200).json(permissoes);
  } catch (error) {
    console.error("Erro ao buscar permissões de funcionalidade:", error);
    res.status(500).json({ message: 'Erro ao buscar permissões de funcionalidade.', errorDetails: error.message });
  }
};

// Obter uma permissão de funcionalidade específica pelo nome
export const getFuncionalidadePermissaoByNome = async (req, res) => {
  try {
    const { nomeFuncionalidade } = req.params;
    if (!db.FuncionalidadePermissao) {
      console.error("[getFuncionalidadePermissaoByNome] Modelo FuncionalidadePermissao não disponível em db.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo de permissão não inicializado." });
    }
    const permissao = await db.FuncionalidadePermissao.findOne({
      where: { nomeFuncionalidade: nomeFuncionalidade }
    });

    if (!permissao) {
      return res.status(404).json({ message: `Permissão para a funcionalidade '${nomeFuncionalidade}' não encontrada.` });
    }
    res.status(200).json(permissao);
  } catch (error) {
    console.error(`Erro ao buscar permissão para ${req.params.nomeFuncionalidade}:`, error);
    res.status(500).json({ message: 'Erro ao buscar permissão da funcionalidade.', errorDetails: error.message });
  }
};

// Criar ou atualizar uma permissão de funcionalidade
export const upsertFuncionalidadePermissao = async (req, res) => {
  const { nomeFuncionalidade, descricao, credenciaisPermitidas, cargosPermitidos } = req.body;

  try {
    // Acesse o modelo diretamente de 'db' AQUI DENTRO
    if (!db.FuncionalidadePermissao) {
      console.error("[upsertFuncionalidadePermissao] Modelo FuncionalidadePermissao não disponível em db.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo de permissão não inicializado." });
    }
    let permissao = await db.FuncionalidadePermissao.findOne({ // ESTA LINHA DEVE FUNCIONAR AGORA
      where: { nomeFuncionalidade: nomeFuncionalidade }
    });

    const dados = {
      nomeFuncionalidade,
      descricao,
      credenciaisPermitidas: credenciaisPermitidas || [],
      cargosPermitidos: cargosPermitidos || [],
    };

    if (permissao) {
      await permissao.update(dados);
      res.status(200).json({ message: `Permissão para '${nomeFuncionalidade}' atualizada.`, data: permissao });
    } else {
      permissao = await db.FuncionalidadePermissao.create(dados);
      res.status(201).json({ message: `Permissão para '${nomeFuncionalidade}' criada.`, data: permissao });
    }
  } catch (error) {
    console.error(`Erro ao salvar permissão para ${nomeFuncionalidade}:`, error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Erro de validação ou nome da funcionalidade já existe.', errors: error.errors ? error.errors.map(e => ({msg: e.message, path: e.path})) : error.message });
    }
    res.status(500).json({ message: 'Erro ao salvar permissão da funcionalidade.', errorDetails: error.message });
  }
};


// Deletar uma permissão de funcionalidade
export const deleteFuncionalidadePermissao = async (req, res) => {
  try {
    const { nomeFuncionalidade } = req.params;
    if (!db.FuncionalidadePermissao) {
      console.error("[deleteFuncionalidadePermissao] Modelo FuncionalidadePermissao não disponível em db.");
      return res.status(500).json({ message: "Erro interno do servidor: Modelo de permissão não inicializado." });
    }
    const permissao = await db.FuncionalidadePermissao.findOne({
      where: { nomeFuncionalidade: nomeFuncionalidade }
    });

    if (!permissao) {
      return res.status(404).json({ message: `Permissão para a funcionalidade '${nomeFuncionalidade}' não encontrada para exclusão.` });
    }

    await permissao.destroy();
    res.status(200).json({ message: `Permissão para a funcionalidade '${nomeFuncionalidade}' deletada com sucesso.` });
  } catch (error) {
    console.error(`Erro ao deletar permissão para ${req.params.nomeFuncionalidade}:`, error);
    res.status(500).json({ message: 'Erro ao deletar permissão da funcionalidade.', errorDetails: error.message });
  }
};