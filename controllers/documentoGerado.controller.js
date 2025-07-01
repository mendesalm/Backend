import documentoGeradoService from '../services/documentoGerado.service.js';

async function gerarDocumento(req, res) {
  try {
    const { tipo } = req.params;
    const dados = req.body;
    const lodgeMemberId = req.user.id;

    const documento = await documentoGeradoService.gerarDocumento(tipo, dados, lodgeMemberId);

    res.status(201).json(documento);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getDocumentos(req, res) {
    try {
        const documentos = await documentoGeradoService.getDocumentos(req.query);
        res.status(200).json(documentos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getDocumentoById(req, res) {
    try {
        const { id } = req.params;
        const documento = await documentoGeradoService.getDocumentoById(id);
        if (!documento) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }
        res.status(200).json(documento);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const documentoGeradoController = {
  gerarDocumento,
  getDocumentos,
  getDocumentoById,
};

export default documentoGeradoController;