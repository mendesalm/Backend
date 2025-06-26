// backend/routes/relatorios.routes.js
import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { authorizeByFeature } from "../middlewares/authorizeByFeature.middleware.js";

// Importa todas as funções de controller necessárias
import {
  gerarRelatorioFrequencia,
  gerarRelatorioVisitacoes,
  gerarRelatorioMembros,
  gerarRelatorioAniversariantes,
  gerarRelatorioFinanceiroDetalhado,
  gerarRelatorioCargosGestao,
  gerarRelatorioDatasMaconicas,
  gerarRelatorioEmprestimos,
  gerarRelatorioComissoes,
  gerarRelatorioPatrimonio,
} from "../controllers/relatorios.controller.js";

// Importa os validadores
import {
  validacaoPeriodo,
  validacaoMes,
  validacaoEmprestimos,
  validacaoFinanceiroDetalhado,
} from "../validators/relatorios.validator.js";

const router = express.Router();

// Aplica a autenticação a todas as rotas de relatórios
router.use(authMiddleware);

// --- Definição de Todas as Rotas de Relatórios ---
// CORREÇÃO: As rotas foram ajustadas para incluir '/pdf' e corresponder ao frontend.

router.get(
  "/frequencia/pdf",
  authorizeByFeature("gerarRelatorioFrequencia"),
  validacaoPeriodo,
  gerarRelatorioFrequencia
);

router.get(
  "/visitacoes/pdf",
  authorizeByFeature("gerarRelatorioVisitacoes"),
  validacaoPeriodo,
  gerarRelatorioVisitacoes
);

router.get(
  "/membros/pdf",
  authorizeByFeature("gerarRelatorioMembros"),
  gerarRelatorioMembros
);

router.get(
  "/aniversariantes/pdf",
  authorizeByFeature("gerarRelatorioAniversariantes"),
  validacaoMes,
  gerarRelatorioAniversariantes
);

router.get(
  "/financeiro-detalhado/pdf",
  authorizeByFeature("gerarRelatorioFinanceiro"),
  validacaoPeriodo, // Alterado para validacaoPeriodo, pois espera dataInicio e dataFim
  gerarRelatorioFinanceiroDetalhado
);

router.get(
  "/cargos-gestao/pdf",
  authorizeByFeature("gerarRelatorioCargos"),
  gerarRelatorioCargosGestao
);

router.get(
  "/datas-maconicas/pdf",
  authorizeByFeature("gerarRelatorioDatasMaconicas"),
  validacaoMes,
  gerarRelatorioDatasMaconicas
);

router.get(
  "/emprestimos/pdf",
  authorizeByFeature("gerarRelatorioEmprestimos"),
  validacaoEmprestimos,
  gerarRelatorioEmprestimos
);

router.get(
  "/comissoes/pdf",
  authorizeByFeature("gerarRelatorioComissoes"),
  validacaoPeriodo,
  gerarRelatorioComissoes
);

router.get(
  "/patrimonio/pdf",
  authorizeByFeature("gerarRelatorioPatrimonio"),
  gerarRelatorioPatrimonio
);

export default router;
