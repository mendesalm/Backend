// routes/harmonia.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";
import { uploadAudio } from "../middlewares/upload.middleware.js";
import * as harmoniaController from "../controllers/harmonia.controller.js";

const router = express.Router();
router.use(authMiddleware);

// Permissões
const canView = authorizeByFeature("visualizarHarmonia");
const canManageMusicas = authorizeByFeature("gerenciarMusicas");
const canManagePlaylists = authorizeByFeature("gerenciarPlaylists");
const canManageEstrutura = authorizeByFeature("gerenciarEstruturaHarmonia");

// --- Rota Principal do Player ---
router.get(
  "/sequencia/:tipoSessaoId",
  canView,
  harmoniaController.getSequenciaByTipoSessao
);

// --- Rotas de Gerenciamento de Tipos de Sessão ---
router.get(
  "/tipos-sessao",
  canManageEstrutura,
  harmoniaController.getAllTiposSessao
);
router.get(
  "/tipos-sessao/:id",
  canManageEstrutura,
  harmoniaController.getTipoSessaoById
);
router.post(
  "/tipos-sessao",
  canManageEstrutura,
  harmoniaController.createTipoSessao
);
router.put(
  "/tipos-sessao/:id",
  canManageEstrutura,
  harmoniaController.updateTipoSessao
);
router.delete(
  "/tipos-sessao/:id",
  canManageEstrutura,
  harmoniaController.deleteTipoSessao
);

// --- Rotas de Gerenciamento de Playlists ---
router.get(
  "/playlists",
  canManagePlaylists,
  harmoniaController.getAllPlaylists
);
router.get(
  "/playlists/:id",
  canManagePlaylists,
  harmoniaController.getPlaylistById
);
router.post(
  "/playlists",
  canManagePlaylists,
  harmoniaController.createPlaylist
);
router.put(
  "/playlists/:id",
  canManagePlaylists,
  harmoniaController.updatePlaylist
);
router.delete(
  "/playlists/:id",
  canManagePlaylists,
  harmoniaController.deletePlaylist
);

// --- INÍCIO DA MODIFICAÇÃO ---
// Endpoint específico para adicionar uma música existente a uma playlist
router.post(
  "/playlists/:playlistId/musicas",
  canManagePlaylists, // Requer permissão para gerenciar playlists
  harmoniaController.addMusicaToPlaylist
);
// --- FIM DA MODIFICAÇÃO ---

// --- Rotas de Gerenciamento de Músicas ---
router.get("/musicas", canManageMusicas, harmoniaController.getAllMusicas);
router.get("/musicas/:id", canManageMusicas, harmoniaController.getMusicaById);
router.post(
  "/musicas",
  canManageMusicas,
  uploadAudio.single("audioFile"),
  harmoniaController.createMusica
);
router.put("/musicas/:id", canManageMusicas, harmoniaController.updateMusica);
router.delete(
  "/musicas/:id",
  canManageMusicas,
  harmoniaController.deleteMusica
);

// --- Rotas para Gerenciar Associações ---
router.post(
  "/tipos-sessao/:tipoSessaoId/playlists",
  canManageEstrutura,
  harmoniaController.assignPlaylistsToTipoSessao
);

export default router;
