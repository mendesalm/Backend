import { DataTypes } from 'sequelize';

export default function FuncionalidadePermissaoModel(sequelize) {
  const FuncionalidadePermissao = sequelize.define('FuncionalidadePermissao', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nomeFuncionalidade: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Identificador único da funcionalidade (ex: gerenciarUsuarios, visualizarRelatoriosFinanceiros).',
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descrição amigável da funcionalidade para exibição na interface de administração.',
    },
    credenciaisPermitidas: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [], // Default para um array vazio se não especificado
      comment: 'Array de strings das credenciais de acesso (LodgeMember.credencialAcesso) permitidas. Ex: ["Webmaster", "Diretoria"]',
      get() {
        const rawValue = this.getDataValue('credenciaisPermitidas');
        // Garante que sempre retorne um array, mesmo que o JSON seja nulo ou malformado no DB por algum motivo
        if (Array.isArray(rawValue)) {
          return rawValue;
        }
        try {
          // Tenta parsear se for uma string JSON (embora Sequelize deva lidar com isso)
          const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return []; // Retorna array vazio em caso de erro de parse
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          // Garante que apenas strings entrem no array e remove duplicatas
          this.setDataValue('credenciaisPermitidas', [...new Set(value.filter(item => typeof item === 'string'))]);
        } else {
          this.setDataValue('credenciaisPermitidas', []);
        }
      },
    },
    cargosPermitidos: {
      type: DataTypes.JSON,
      allowNull: true, // Pode não haver cargos específicos, apenas credenciais
      defaultValue: [],
      comment: 'Array de strings dos nomes de cargos (CargoExercido.nomeCargo) permitidos. Ex: ["Secretario", "Tesoureiro"]',
      get() {
        const rawValue = this.getDataValue('cargosPermitidos');
        if (Array.isArray(rawValue)) {
          return rawValue;
        }
        try {
          const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      },
      set(value) {
        if (value === null || value === undefined) {
             this.setDataValue('cargosPermitidos', []);
        } else if (Array.isArray(value)) {
          this.setDataValue('cargosPermitidos', [...new Set(value.filter(item => typeof item === 'string'))]);
        } else {
          this.setDataValue('cargosPermitidos', []);
        }
      },
    }
  }, {
    tableName: 'FuncionalidadePermissoes',
    timestamps: true, // Adiciona createdAt e updatedAt
    comment: 'Tabela para armazenar as permissões de acesso baseadas em funcionalidades do sistema.',
  });

  // Associação (se houver alguma direta no futuro, por enquanto não é necessário)
  // FuncionalidadePermissao.associate = (models) => {
  //   // Exemplo: se cada permissão fosse criada por um usuário específico
  //   // FuncionalidadePermissao.belongsTo(models.LodgeMember, {
  //   //   foreignKey: 'criadoPorId',
  //   //   as: 'criador',
  //   // });
  // };

  return FuncionalidadePermissao;
}