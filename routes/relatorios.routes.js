// routes/relatorios.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as relatoriosController from '../controllers/relatorios.controller.js';
import {
  periodoRules,
  periodoAniversarioRules,
  financeiroDetalhadoRules,
  historicoLivroRules,
  handleValidationErrors
} from '../validators/relatorios.validator.js';

const router = express.Router();

// Protege todas as rotas de relatórios com autenticação
router.use(authMiddleware);

// --- ROTAS EXISTENTES ---
router.get('/frequencia/pdf',
  authorizeByFeature('exportarRelatorioFrequencia'),
  periodoRules,
  handleValidationErrors,
  relatoriosController.gerarRelatorioFrequencia
);

router.get('/visitacoes/pdf',
  authorizeByFeature('exportarRelatorioVisitacoes'),
  periodoRules,
  handleValidationErrors,
  relatoriosController.gerarRelatorioVisitacoes
);

router.get('/membros/pdf',
  authorizeByFeature('exportarRelatorioMembros'),
  relatoriosController.gerarRelatorioMembros
);

router.get('/aniversariantes/pdf',
  authorizeByFeature('exportarRelatorioAniversariantes'),
  periodoAniversarioRules,
  handleValidationErrors,
  relatoriosController.gerarRelatorioAniversariantes
);

// --- ROTAS NOVAS ---
router.get('/financeiro/detalhado/pdf',
  authorizeByFeature('exportarRelatorioFinanceiroDetalhado'),
  financeiroDetalhadoRules,
  handleValidationErrors,
  relatoriosController.gerarRelatorioFinanceiroDetalhado
);

router.get('/cargos/pdf',
  authorizeByFeature('exportarRelatorioCargosGestao'),
  relatoriosController.gerarRelatorioCargosGestao
);

router.get('/datas-maconicas/pdf',
  authorizeByFeature('exportarRelatorioDatasMaconicas'),
  periodoAniversarioRules,
  handleValidationErrors,
  relatoriosController.gerarRelatorioDatasMaconicas
);

router.get('/biblioteca/emprestimos/pdf',
  authorizeByFeature('exportarRelatorioEmprestimos'),
  // A validação de query params é feita no controller para esta rota (tipo, livroId)
  relatoriosController.gerarRelatorioEmprestimos
);

router.get('/comissoes/pdf',
  authorizeByFeature('exportarRelatorioComissoes'),
  periodoRules,
  handleValidationErrors,
  relatoriosController.gerarRelatorioComissoes
);
router.get('/patrimonio/pdf',
  authorizeByFeature('exportarRelatorioPatrimonio'),
  relatoriosController.gerarRelatorioPatrimonio
);
export default router;
