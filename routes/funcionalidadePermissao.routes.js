import express from 'express';
import * as funcionalidadePermissaoController from '../controllers/funcionalidadePermissao.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/roleAuth.middleware.js'; // O middleware original que verifica credencialAcesso
import { 
    funcionalidadePermissaoValidator, 
    nomeFuncionalidadeParamValidator 
} from '../validators/funcionalidadePermissao.validator.js';

const router = express.Router();

// Todas as rotas aqui devem ser protegidas e acessíveis apenas pelo Webmaster
const webmasterOnly = authorize(['Webmaster']);

// GET /api/permissoes - Listar todas as configurações de permissão
router.get(
  '/',
  authMiddleware,
  webmasterOnly,
  funcionalidadePermissaoController.getAllFuncionalidadePermissoes
);

// GET /api/permissoes/:nomeFuncionalidade - Obter uma configuração específica
router.get(
  '/:nomeFuncionalidade',
  authMiddleware,
  webmasterOnly,
  nomeFuncionalidadeParamValidator,
  funcionalidadePermissaoController.getFuncionalidadePermissaoByNome
);

// PUT /api/permissoes - Criar ou atualizar uma configuração de permissão
// Usamos PUT para upsert. O nome da funcionalidade virá no corpo.
router.put(
  '/', // Ou poderia ser '/:nomeFuncionalidade' se preferir pegar o nome da URL e o resto do corpo.
       // Se for '/:nomeFuncionalidade', ajuste o controller para pegar o nome do param.
       // Para este exemplo, o nome vem do body.
  authMiddleware,
  webmasterOnly,
  funcionalidadePermissaoValidator, // Valida o corpo da requisição
  funcionalidadePermissaoController.upsertFuncionalidadePermissao
);

// DELETE /api/permissoes/:nomeFuncionalidade - Deletar uma configuração de permissão
router.delete(
  '/:nomeFuncionalidade',
  authMiddleware,
  webmasterOnly,
  nomeFuncionalidadeParamValidator,
  funcionalidadePermissaoController.deleteFuncionalidadePermissao
);

export default router;