import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS || null;
const dbHost = process.env.DB_HOST;
const dbDialect = process.env.DB_DIALECT;

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: dbDialect,
  logging: false, // Desativado para logs mais limpos, pode ativar para depuração
  dialectOptions: {
    // Garante que o driver do banco de dados use strings para datas
    dateStrings: true,
    // Força o driver a usar o timezone local em vez de UTC
    typeCast: true,
  },
  // Define o timezone da aplicação para o horário de Brasília
  timezone: "-03:00",
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Array de definições de modelos completo
const modelDefinitions = [
  { key: "LodgeMember", file: "lodgemember.model.js" },
  { key: "FamilyMember", file: "familymember.model.js" },
  { key: "MasonicSession", file: "masonicsession.model.js" },
  { key: "SessionAttendee", file: "sessionattendee.model.js" },
  { key: "CargoExercido", file: "cargoexercido.model.js" },
  { key: "Balaustre", file: "balaustre.model.js" },
  { key: "Publicacao", file: "publicacao.model.js" },
  { key: "Musica", file: "musica.model.js" },
  { key: "Playlist", file: "playlist.model.js" },
  { key: "TipoSessao", file: "tiposessao.model.js" },
  { key: "TipoSessaoPlaylist", file: "tiposessaoplaylist.model.js" },
  { key: "Biblioteca", file: "biblioteca.model.js" },
  { key: "VisitanteSessao", file: "visitantesessao.model.js" },
  { key: "FuncionalidadePermissao", file: "funcionalidadepermissao.model.js" },
  { key: "Comissao", file: "comissao.model.js" },
  { key: "MembroComissao", file: "membro_comissao.model.js" },
  { key: "Visita", file: "visitacao.model.js" },
  { key: "Condecoracao", file: "condecoracao.model.js" },
  { key: "Emprestimo", file: "emprestimo.model.js" },
  { key: "Conta", file: "conta.model.js" },
  { key: "Lancamento", file: "lancamento.model.js" },
  { key: "Aviso", file: "aviso.model.js" },
  { key: "Patrimonio", file: "patrimonio.model.js" },
  { key: "Orcamento", file: "orcamento.model.js" },
  { key: "Reserva", file: "reserva.model.js" },
  { key: "Evento", file: "evento.model.js" },
  { key: "ParticipanteEvento", file: "participante_evento.model.js" },
  { key: "MenuItem", file: "menu_item.model.js" },
  { key: "FotoEvento", file: "foto_evento.model.js" },
  { key: "ResponsabilidadeJantar", file: "responsabilidade_jantar.model.js" },
  { key: "Configuracao", file: "configuracao.model.js" },
  { key: "Legislacao", file: "legislacao.model.js" },
  { key: "Documento", file: "documento.model.js" },
  { key: "ArquivoDiverso", file: "arquivoDiverso.model.js" },
  { key: "Classificado", file: "classificado.model.js" },
  { key: "FotoClassificado", file: "fotoClassificado.model.js" },
  { key: "LocacaoSalao", file: "locacaoSalao.model.js" },
  { key: "EmprestimoPatrimonio", file: "emprestimoPatrimonio.model.js" },
  { key: "Loja", file: "loja.model.js" },
  {
    key: "ItemEmprestimoPatrimonio",
    file: "itemEmprestimoPatrimonio.model.js",
  },
  { key: "DocumentoGerado", file: "documentoGerado.model.js" },
  { key: "CorpoMensagem", file: "corpomensagem.js" },
];

const loadModel = async (modelFileName) => {
  const absolutePath = path.join(__dirname, modelFileName);
  const modelURL = pathToFileURL(absolutePath).href;
  const importedModule = await import(modelURL);
  return importedModule.default;
};

export const initModels = async () => {
  if (db.initialized) {
    return db;
  }

  for (const modelDef of modelDefinitions) {
    try {
      const defineFunction = await loadModel(modelDef.file);
      const model = defineFunction(sequelize, DataTypes);
      db[modelDef.key] = model;
    } catch (error) {
      console.error(
        `[initModels] FALHA ao carregar o modelo do ficheiro ${modelDef.file}:`,
        error
      );
      process.exit(1);
    }
  }

  Object.keys(db).forEach((modelName) => {
    if (db[modelName] && typeof db[modelName].associate === "function") {
      try {
        db[modelName].associate(db);
      } catch (assocError) {
        console.error(
          `[initModels] ERRO ao executar associate() para ${modelName}:`,
          assocError
        );
      }
    }
  });

  db.initialized = true;
  return db;
};

export default db;
