import db from '../models/index.js';
const { DocumentoGerado, LodgeMember, CorpoMensagem, CargoExercido, FamilyMember, sequelize } = db;
import { Op, fn } from 'sequelize';

async function gerarDocumento(tipo, dados, lodgeMemberId) {
  // Lógica para Prancha
  if (tipo === 'Prancha') {
    const { titulo, conteudo, placeholders } = dados;
    const anoCorrente = new Date().getFullYear();
    const ultimaPrancha = await DocumentoGerado.findOne({
      where: { tipo: 'Prancha', ano: anoCorrente },
      order: [['numero', 'DESC']],
    });
    const numeroPrancha = ultimaPrancha ? ultimaPrancha.numero + 1 : 1;

    let conteudoFinal = conteudo;
    if (placeholders) {
      for (const key in placeholders) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        conteudoFinal = conteudoFinal.replace(regex, placeholders[key]);
      }
    }

    return DocumentoGerado.create({
      tipo,
      titulo,
      conteudo: conteudoFinal,
      numero: numeroPrancha,
      ano: anoCorrente,
      lodgeMemberId,
    });
  }

  // Lógica para Cartão de Aniversário
  if (tipo === 'CARTAO_ANIVERSARIO') {
    const { homenageadoId, subtipo, template } = dados; // subtipo: 'IRMAO' ou 'FAMILIAR'

    // 1. Buscar Venerável Mestre atual
    const hoje = new Date();
    const veneravelMestreCargo = await CargoExercido.findOne({
      where: {
        nomeCargo: 'Venerável Mestre',
        dataInicio: { [Op.lte]: hoje },
        [Op.or]: [
          { dataTermino: { [Op.gte]: hoje } },
          { dataTermino: null }
        ]
      },
      include: [{ model: LodgeMember, as: 'membro', attributes: ['name'] }]
    });
    const nomeVeneravel = veneravelMestreCargo ? veneravelMestreCargo.membro.name : 'Venerável Mestre não encontrado';

    // 2. Buscar dados do homenageado
    let homenageado;
    let dataNascimento;
    if (subtipo === 'IRMAO') {
      homenageado = await LodgeMember.findByPk(homenageadoId, { attributes: ['name', 'birthDate'] });
      dataNascimento = homenageado.birthDate;
    } else if (subtipo === 'FAMILIAR') {
      homenageado = await FamilyMember.findByPk(homenageadoId, { attributes: ['nomeCompleto', 'dataNascimento'] });
      dataNascimento = homenageado.dataNascimento;
    }
     if (!homenageado) {
      throw new Error('Homenageado não encontrado.');
    }
    const nomeHomenageado = subtipo === 'IRMAO' ? homenageado.name : homenageado.nomeCompleto;


    // 3. Buscar mensagem aleatória
    const mensagemAleatoria = await CorpoMensagem.findOne({
      where: { tipo: 'ANIVERSARIO', subtipo: subtipo, ativo: true },
      order: sequelize.random() // Ou fn('RAND') para MySQL
    });
    if (!mensagemAleatoria) {
      throw new Error(`Nenhuma mensagem de aniversário ativa encontrada para o subtipo '${subtipo}'.`);
    }

    // 4. Montar o conteúdo final
    const dataHomenagem = new Date(dataNascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    const anoAtual = hoje.getFullYear();
    
    let conteudoFinal = template;
    conteudoFinal = conteudoFinal.replace(/{{homenageado}}/g, nomeHomenageado);
    conteudoFinal = conteudoFinal.replace(/{{data_homenagem}}/g, dataHomenagem);
    conteudoFinal = conteudoFinal.replace(/{{ano_atual}}/g, anoAtual);
    conteudoFinal = conteudoFinal.replace(/{{veneravel}}/g, nomeVeneravel);
    conteudoFinal = conteudoFinal.replace(/{{mensagem}}/g, mensagemAleatoria.conteudo);
    // O vocativo pode ser adicionado aqui ou vir do template
    conteudoFinal = conteudoFinal.replace(/{{vocativo}}/g, subtipo === 'IRMAO' ? 'Meu Irmão' : 'Prezado(a) Familiar');


    return DocumentoGerado.create({
      tipo,
      titulo: `Cartão de Aniversário - ${nomeHomenageado}`,
      conteudo: conteudoFinal,
      lodgeMemberId: lodgeMemberId, // ID de quem gerou o documento
    });
  }

  // Se o tipo de documento não for reconhecido
  throw new Error('Tipo de documento não suportado.');
}

async function getDocumentos(filters) {
    const where = {};
    if (filters.tipo) {
        where.tipo = filters.tipo;
    }
    if (filters.termo) {
        where[Op.or] = [
            { titulo: { [Op.like]: `%${filters.termo}%` } },
            { conteudo: { [Op.like]: `%${filters.termo}%` } }
        ];
    }

    const documentos = await DocumentoGerado.findAll({
        where,
        include: [{ model: LodgeMember, attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
    });
    return documentos;
}

async function getDocumentoById(id) {
    const documento = await DocumentoGerado.findByPk(id, {
        include: [{ model: LodgeMember, attributes: ['name', 'masonicDegree'] }]
    });
    return documento;
}

const documentoGeradoService = {
  gerarDocumento,
  getDocumentos,
  getDocumentoById,
};

export default documentoGeradoService;