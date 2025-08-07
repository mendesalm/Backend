import db from "../models/index.js";
import fs from "fs";
import path from "path";

const removeAudioFile = (relativePath) => {
  if (!relativePath) return;
  const fullPath = path.resolve(process.cwd(), "uploads", relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Arquivo de áudio removido: ${fullPath}`);
    } catch (err) {
      console.error(`Erro ao remover arquivo de áudio:`, err);
    }
  }
};

// --- Lógica Principal do Player ---
export const getSequenciaByTipoSessao = async (req, res) => {
  const { tipoSessaoId } = req.params;
  try {
    const tipoSessao = await db.TipoSessao.findByPk(tipoSessaoId, {
      include: [
        {
          model: db.Playlist,
          as: "playlists",
          include: [
            {
              model: db.Musica,
              as: "musicas",
              attributes: ["id", "titulo", "autor", "path"],
            },
          ],
        },
      ],
      order: [
        [
          { model: db.Playlist, as: "playlists" },
          db.TipoSessaoPlaylist,
          "ordem",
          "ASC",
        ],
      ],
    });

    if (!tipoSessao) {
      return res
        .status(404)
        .json({ message: "Tipo de sessão não encontrado." });
    }

    const sequenciaFinal = tipoSessao.playlists.map((playlist) => {
      let musicaSorteada = null;
      if (playlist.musicas && playlist.musicas.length > 0) {
        const indiceSorteado = Math.floor(
          Math.random() * playlist.musicas.length
        );
        musicaSorteada = playlist.musicas[indiceSorteado];
      }
      return {
        playlist: { id: playlist.id, nome: playlist.nome },
        musicaSorteada: musicaSorteada,
      };
    });

    res.status(200).json({
      nome: tipoSessao.nome,
      sequencia: sequenciaFinal,
    });
  } catch (error) {
    console.error("Erro ao buscar sequência de harmonia:", error);
    res.status(500).json({
      message: "Erro ao buscar sequência de harmonia.",
      errorDetails: error.message,
    });
  }
};

// --- CRUD para Tipos de Sessão ---

/**
 * GET /api/harmonia/tipos-sessao
 * Lista todos os Tipos de Sessão.
 */
export const getAllTiposSessao = async (req, res) => {
  try {
    // --- INÍCIO DA CORREÇÃO ---
    const tipos = await db.TipoSessao.findAll({
      // Inclui o modelo Playlist através da associação 'playlists'
      include: [
        {
          model: db.Playlist,
          as: "playlists",
        },
      ],
      order: [
        ["nome", "ASC"], // Ordena os tipos de sessão por nome
        // Ordena as playlists aninhadas pela ordem definida na junção
        [
          { model: db.Playlist, as: "playlists" },
          db.TipoSessaoPlaylist,
          "ordem",
          "ASC",
        ],
      ],
    });
    // --- FIM DA CORREÇÃO ---
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar tipos de sessão.",
      errorDetails: error.message,
    });
  }
};

export const getTipoSessaoById = async (req, res) => {
  try {
    const tipoSessao = await db.TipoSessao.findByPk(req.params.id, {
      include: [
        {
          model: db.Playlist,
          as: "playlists",
          include: [
            {
              model: db.Musica,
              as: "musicas",
              attributes: ["id", "titulo", "autor", "path"],
            },
          ],
        },
      ],
    });
    if (!tipoSessao)
      return res
        .status(404)
        .json({ message: "Tipo de sessão não encontrado." });
    res.status(200).json(tipoSessao);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar tipo de sessão.",
      errorDetails: error.message,
    });
  }
};

export const createTipoSessao = async (req, res) => {
  try {
    const novoTipo = await db.TipoSessao.create(req.body);
    res.status(201).json(novoTipo);
  } catch (error) {
    res.status(400).json({
      message: "Erro ao criar tipo de sessão.",
      errorDetails: error.message,
    });
  }
};

export const updateTipoSessao = async (req, res) => {
  try {
    const [updated] = await db.TipoSessao.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res
        .status(404)
        .json({ message: "Tipo de sessão não encontrado." });
    const updatedItem = await db.TipoSessao.findByPk(req.params.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({
      message: "Erro ao atualizar tipo de sessão.",
      errorDetails: error.message,
    });
  }
};

export const deleteTipoSessao = async (req, res) => {
  try {
    const deleted = await db.TipoSessao.destroy({
      where: { id: req.params.id },
    });
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Tipo de sessão não encontrado." });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar tipo de sessão.",
      errorDetails: error.message,
    });
  }
};

// --- CRUD para Playlists ---
export const getAllPlaylists = async (req, res) => {
  try {
    const playlists = await db.Playlist.findAll({
      include: [
        { model: db.Musica, as: "musicas", attributes: ["id", "titulo"] },
      ],
      order: [["nome", "ASC"]],
    });
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar playlists.",
      errorDetails: error.message,
    });
  }
};

export const getPlaylistById = async (req, res) => {
  try {
    const playlist = await db.Playlist.findByPk(req.params.id, {
      include: [{ model: db.Musica, as: "musicas" }],
    });
    if (!playlist)
      return res.status(404).json({ message: "Playlist não encontrada." });
    res.status(200).json(playlist);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar playlist.",
      errorDetails: error.message,
    });
  }
};

export const createPlaylist = async (req, res) => {
  try {
    const novaPlaylist = await db.Playlist.create(req.body);
    res.status(201).json(novaPlaylist);
  } catch (error) {
    res.status(400).json({
      message: "Erro ao criar playlist.",
      errorDetails: error.message,
    });
  }
};

export const updatePlaylist = async (req, res) => {
  try {
    const [updated] = await db.Playlist.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res.status(404).json({ message: "Playlist não encontrada." });
    const updatedItem = await db.Playlist.findByPk(req.params.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({
      message: "Erro ao atualizar playlist.",
      errorDetails: error.message,
    });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const playlist = await db.Playlist.findByPk(req.params.id, {
      include: ["musicas"],
    });
    if (!playlist)
      return res.status(404).json({ message: "Playlist não encontrada." });
    for (const musica of playlist.musicas) {
      removeAudioFile(musica.path);
    }
    await playlist.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar playlist.",
      errorDetails: error.message,
    });
  }
};

// --- INÍCIO DA MODIFICAÇÃO ---
/**
 * POST /api/harmonia/playlists/:playlistId/musicas
 * Adiciona uma música já existente a uma playlist.
 */
export const addMusicaToPlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const { musicaId } = req.body;

  if (!musicaId) {
    return res.status(400).json({ message: "O ID da música é obrigatório." });
  }

  try {
    const playlist = await db.Playlist.findByPk(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist não encontrada." });
    }

    const musica = await db.Musica.findByPk(musicaId);
    if (!musica) {
      return res.status(404).json({ message: "Música não encontrada." });
    }

    // Atualiza o campo 'playlistId' da música para associá-la à nova playlist
    await musica.update({ playlistId: playlist.id });

    res.status(200).json({
      message: "Música adicionada à playlist com sucesso!",
      musica: musica,
    });
  } catch (error) {
    console.error("Erro ao adicionar música à playlist:", error);
    res.status(500).json({
      message: "Erro ao adicionar música à playlist.",
      errorDetails: error.message,
    });
  }
};
// --- FIM DA MODIFICAÇÃO ---

// --- CRUD para Musicas ---
export const getAllMusicas = async (req, res) => {
  try {
    const musicas = await db.Musica.findAll({ order: [["titulo", "ASC"]] });
    res.status(200).json(musicas);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar músicas.",
      errorDetails: error.message,
    });
  }
};

export const getMusicaById = async (req, res) => {
  try {
    const musica = await db.Musica.findByPk(req.params.id);
    if (!musica)
      return res.status(404).json({ message: "Música não encontrada." });
    res.status(200).json(musica);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar música.", errorDetails: error.message });
  }
};

export const createMusica = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Nenhum arquivo de áudio enviado." });
  }
  const { titulo, autor, playlistId } = req.body;
  try {
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    const relativePath = path
      .relative(uploadsDir, req.file.path)
      .replace(/\\/g, "/");
    const novaMusica = await db.Musica.create({
      titulo: titulo || req.file.originalname,
      autor,
      path: relativePath,
      playlistId: playlistId || null,
    });
    res.status(201).json(novaMusica);
  } catch (error) {
    removeAudioFile(req.file.path);
    res.status(400).json({
      message: "Erro ao adicionar música.",
      errorDetails: error.message,
    });
  }
};

export const updateMusica = async (req, res) => {
  try {
    const [updated] = await db.Musica.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res.status(404).json({ message: "Música não encontrada." });
    const updatedItem = await db.Musica.findByPk(req.params.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({
      message: "Erro ao atualizar música.",
      errorDetails: error.message,
    });
  }
};

export const deleteMusica = async (req, res) => {
  try {
    const musica = await db.Musica.findByPk(req.params.id);
    if (!musica)
      return res.status(404).json({ message: "Música não encontrada." });
    removeAudioFile(musica.path);
    await musica.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar música.",
      errorDetails: error.message,
    });
  }
};

// --- Gerenciamento de Relacionamentos ---
export const assignPlaylistsToTipoSessao = async (req, res) => {
  const { tipoSessaoId } = req.params;
  const { playlists } = req.body;
  try {
    const tipoSessao = await db.TipoSessao.findByPk(tipoSessaoId);
    if (!tipoSessao)
      return res
        .status(404)
        .json({ message: "Tipo de sessão não encontrado." });
    await db.TipoSessaoPlaylist.destroy({ where: { tipoSessaoId } });
    if (playlists && playlists.length > 0) {
      const associacoes = playlists.map((p) => ({
        tipoSessaoId: parseInt(tipoSessao.id, 10),
        playlistId: p.playlistId,
        ordem: p.ordem,
      }));
      await db.TipoSessaoPlaylist.bulkCreate(associacoes);
    }
    res
      .status(200)
      .json({ message: "Sequência de playlists definida com sucesso!" });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao definir sequência.",
      errorDetails: error.message,
    });
  }
};
