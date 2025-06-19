// backend/app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { sequelize, initModels } from "./models/index.js";

// Importar TODOS os arquivos de rotas do projeto
import authRoutes from "./routes/auth.routes.js";
import lodgeMemberRoutes from "./routes/lodgemember.routes.js";
import familyMemberRoutes from "./routes/familymember.routes.js";
import cargoExercidoRoutes from "./routes/cargoexercido.routes.js";
import funcionalidadePermissaoRoutes from "./routes/funcionalidadePermissao.routes.js";
import masonicSessionRoutes from "./routes/masonicsession.routes.js";
import bibliotecaRoutes from "./routes/biblioteca.routes.js";
import harmoniaRoutes from "./routes/harmonia.routes.js";
import publicacaoRoutes from "./routes/publicacao.routes.js";
import comissaoRoutes from "./routes/comissao.routes.js";
import visitaRoutes from "./routes/visitacao.routes.js";
import {
  emprestimoRoutes,
  emprestimoMembroRoutes,
} from "./routes/emprestimo.routes.js";
import financeiroRoutes from "./routes/financeiro.routes.js";
import relatoriosRoutes from "./routes/relatorios.routes.js";
import eventoRoutes from "./routes/evento.routes.js";
import avisoRoutes from "./routes/aviso.routes.js";
import patrimonioRoutes from "./routes/patrimonio.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import menuItemsRoutes from "./routes/menu_item.routes.js";
import templateRoutes from "./routes/template.routes.js";
import balaustreRoutes from "./routes/balaustre.routes.js";
import escalaRoutes from "./routes/escala.routes.js";
// Importa o agendador de tarefas
import { startScheduler } from "./scheduler.js";

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares Globais
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rota de teste simples para a API
app.get("/api", (req, res) => {
  res.json({
    message: `API da Loja Maçônica ${
      process.env.APP_NAME || "SysJPJ"
    } funcionando!`,
  });
});

// Função assíncrona para iniciar o servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    await initModels();
    console.log("Modelos Sequelize inicializados e prontos.");

    // Inicia o agendador de tarefas APÓS os modelos estarem prontos
    startScheduler();

    console.log("Configurando rotas da API...");

    // Montagem de todas as rotas de nível superior da API
    app.use("/api/auth", authRoutes);
    app.use("/api/permissoes", funcionalidadePermissaoRoutes);
    app.use("/api/lodgemembers", lodgeMemberRoutes);
    app.use("/api/familymembers", familyMemberRoutes);
    app.use("/api/sessions", masonicSessionRoutes);
    app.use("/api/publicacoes", publicacaoRoutes);
    app.use("/api/harmonia", harmoniaRoutes);
    app.use("/api/biblioteca", bibliotecaRoutes);
    app.use("/api/cargoexercido", cargoExercidoRoutes);
    app.use("/api/comissoes", comissaoRoutes);
    app.use("/api/visitas", visitaRoutes);
    app.use("/api/financeiro", financeiroRoutes);
    app.use("/api/emprestimos", emprestimoRoutes);
    app.use("/api/lodgemembers/:membroId/emprestimos", emprestimoMembroRoutes);
    app.use("/api/relatorios", relatoriosRoutes);
    app.use("/api/eventos", eventoRoutes);
    app.use("/api/avisos", avisoRoutes);
    app.use("/api/patrimonio", patrimonioRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/menu-items", menuItemsRoutes);
    app.use("/api/templates", templateRoutes);
    app.use("/api/balaustres", balaustreRoutes);
    app.use("/api/escala", escalaRoutes);
    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor backend rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error(
      "Não foi possível conectar ao banco de dados ou iniciar o servidor:",
      error
    );
    process.exit(1);
  }
};

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error("Ocorreu um erro não tratado:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Erro interno do servidor.",
  });
});

startServer();
