import db from '../models/index.js';
const { DocumentoGerado, LodgeMember } = db;
import { Op } from 'sequelize';

async function gerarDocumento(tipo, dados, lodgeMemberId) {
  const { titulo, conteudo, placeholders } = dados;

  let numeroPrancha = null;
  let anoPrancha = null;

  if (tipo === 'Prancha') {
    const anoCorrente = new Date().getFullYear();
    const ultimaPrancha = await DocumentoGerado.findOne({
      where: {
        tipo: 'Prancha',
        ano: anoCorrente,
      },
      order: [['numero', 'DESC']],
    });

    numeroPrancha = ultimaPrancha ? ultimaPrancha.numero + 1 : 1;
    anoPrancha = anoCorrente;
  }

  // Simple placeholder replacement
  let conteudoFinal = conteudo;
  if (placeholders) {
    for (const key in placeholders) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      conteudoFinal = conteudoFinal.replace(regex, placeholders[key]);
    }
  }

  const documento = await DocumentoGerado.create({
    tipo,
    titulo,
    conteudo: conteudoFinal,
    numero: numeroPrancha,
    ano: anoPrancha,
    lodgeMemberId,
  });

  return documento;
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