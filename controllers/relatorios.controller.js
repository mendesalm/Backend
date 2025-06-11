// controllers/relatorios.controller.js
import db from '../models/index.js';
import {
  gerarPdfFrequencia,
  gerarPdfVisitacoes,
  gerarPdfMembros,
  gerarPdfAniversariantes,
  gerarPdfFinanceiroDetalhado,
  gerarPdfCargosGestao,
  gerarPdfDatasMaconicas,
  gerarPdfEmprestimos,
  gerarPdfComissoes,
  gerarPdfPatrimonio
} from '../utils/pdfGenerator.js';

// CORREÇÃO: Removida a desestruturação de modelos do topo do ficheiro.

// Função genérica para enviar o PDF na resposta
const enviarPdf = (res, pdfDoc, nomeArquivo) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
};

// --- Funções de Geração de Relatórios ---

export const gerarRelatorioFrequencia = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    try {
        const { Op, fn, col } = db.Sequelize;
        const totalSessoesNoPeriodo = await db.MasonicSession.count({ where: { dataSessao: { [Op.between]: [dataInicio, dataFim] } } });
        if (totalSessoesNoPeriodo === 0) {
            return res.status(404).json({ message: 'Nenhuma sessão encontrada no período para gerar o relatório.' });
        }
        
        const membrosAtivos = await db.LodgeMember.findAll({
            attributes: ['id', 'NomeCompleto'],
            where: { Situacao: 'Ativo' },
            order: [['NomeCompleto', 'ASC']]
        });
        
        const presencasCount = await db.LodgeMember.findAll({
             attributes: [ 'id', [fn('COUNT', col('sessoesPresente.id')), 'presencas'] ],
            include: [{
                model: db.MasonicSession,
                as: 'sessoesPresente',
                attributes: [],
                where: { dataSessao: { [Op.between]: [dataInicio, dataFim] } },
                required: true
            }],
            group: ['LodgeMember.id']
        });
        
        const presencasMap = new Map(presencasCount.map(item => [item.id, item.get('presencas')]));
        
        const dadosFrequencia = membrosAtivos.map(membro => {
            const presencas = parseInt(presencasMap.get(membro.id) || 0, 10);
            return {
                nome: membro.NomeCompleto,
                presencas: presencas,
                totalSessoes: totalSessoesNoPeriodo,
                percentual: totalSessoesNoPeriodo > 0 ? (presencas / totalSessoesNoPeriodo) * 100 : 0
            };
        });

        const dataInicioFmt = new Date(dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const dataFimFmt = new Date(dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        const pdfDoc = gerarPdfFrequencia(dadosFrequencia, dataInicioFmt, dataFimFmt);
        enviarPdf(res, pdfDoc, `Relatorio_Frequencia_${dataInicio}_a_${dataFim}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar relatório de frequência:", error);
        res.status(500).json({ message: "Erro ao gerar relatório de frequência.", errorDetails: error.message });
    }
};

export const gerarRelatorioVisitacoes = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    try {
        const { Op, col } = db.Sequelize;
        const visitacoes = await db.Visita.findAll({ 
            where: { dataSessao: { [Op.between]: [dataInicio, dataFim] } }, 
            include: [{ model: db.LodgeMember, as: 'visitante', attributes: ['NomeCompleto'] }], 
            order: [['dataSessao', 'ASC'], [col('visitante.NomeCompleto'), 'ASC']] 
        });
        const dataInicioFmt = new Date(dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const dataFimFmt = new Date(dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const pdfDoc = gerarPdfVisitacoes(visitacoes, dataInicioFmt, dataFimFmt);
        enviarPdf(res, pdfDoc, `Relatorio_Visitacoes_${dataInicio}_a_${dataFim}.pdf`);
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório de visitações.", errorDetails: error.message }); }
};

export const gerarRelatorioMembros = async (req, res) => {
    try {
        const membros = await db.LodgeMember.findAll({ where: { Situacao: 'Ativo' }, order: [['NomeCompleto', 'ASC']] });
        const pdfDoc = gerarPdfMembros(membros);
        enviarPdf(res, pdfDoc, 'Quadro_de_Obreiros.pdf');
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório de membros.", errorDetails: error.message }); }
};

export const gerarRelatorioAniversariantes = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    try {
        const membros = await db.LodgeMember.findAll({ where: { Situacao: 'Ativo' }, attributes: ['NomeCompleto', 'DataNascimento'] });
        const familiares = await db.FamilyMember.findAll({ include: [{model: db.LodgeMember, as: 'LodgeMember', attributes: ['NomeCompleto'], required: true}] });
        let aniversariantes = [];
        const normalizarData = (dataStr) => parseInt(dataStr.replace('-', ''), 10);
        const inicioNormalizado = normalizarData(dataInicio);
        const fimNormalizado = normalizarData(dataFim);
        const verificaIntervalo = (data) => {
            if (!data) return false;
            const dataNormalizada = parseInt(new Date(data).toISOString().substring(5, 10).replace('-', ''), 10);
            return inicioNormalizado <= fimNormalizado ? (dataNormalizada >= inicioNormalizado && dataNormalizada <= fimNormalizado) : (dataNormalizada >= inicioNormalizado || dataNormalizada <= fimNormalizado);
        };
        membros.forEach(m => { if (verificaIntervalo(m.DataNascimento)) aniversariantes.push({ nome: m.NomeCompleto, dataAniversario: new Date(m.DataNascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }), tipo: 'Membro' }); });
        familiares.forEach(f => { if (verificaIntervalo(f.dataNascimento)) aniversariantes.push({ nome: f.nomeCompleto, dataAniversario: new Date(f.dataNascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }), tipo: `Familiar (${f.parentesco})`, relacionadoA: f.LodgeMember ? f.LodgeMember.NomeCompleto : 'N/A' }); });
        aniversariantes.sort((a, b) => normalizarData(a.dataAniversario.split('/').reverse().join('-')) - normalizarData(b.dataAniversario.split('/').reverse().join('-')));
        const pdfDoc = gerarPdfAniversariantes(aniversariantes, dataInicio.replace('-', '/'), dataFim.replace('-', '/'));
        enviarPdf(res, pdfDoc, `Relatorio_Aniversariantes_${dataInicio}_a_${dataFim}.pdf`);
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório de aniversariantes.", errorDetails: error.message }); }
};

export const gerarRelatorioFinanceiroDetalhado = async (req, res) => {
    const { dataInicio, dataFim, contaId } = req.query;
    try {
        const { Op } = db.Sequelize;
        const conta = await db.Conta.findByPk(contaId);
        if (!conta) return res.status(404).json({ message: 'Conta não encontrada.' });
        const lancamentos = await db.Lancamento.findAll({ where: { contaId, dataLancamento: { [Op.between]: [dataInicio, dataFim] } }, include: [{ model: db.LodgeMember, as: 'membroAssociado', attributes: ['NomeCompleto'], required: false }], order: [['dataLancamento', 'ASC']] });
        const dataInicioFmt = new Date(dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const dataFimFmt = new Date(dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const pdfDoc = gerarPdfFinanceiroDetalhado(conta, lancamentos, dataInicioFmt, dataFimFmt);
        enviarPdf(res, pdfDoc, `Extrato_${conta.nome.replace(/\s/g, '_')}.pdf`);
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório financeiro detalhado.", errorDetails: error.message }); }
};

export const gerarRelatorioCargosGestao = async (req, res) => {
    try {
        const cargos = await db.CargoExercido.findAll({ where: { dataFim: null }, include: [{ model: db.LodgeMember, as: 'LodgeMember', attributes: ['NomeCompleto'], required: true }], order: [['nomeCargo', 'ASC']] });
        const pdfDoc = gerarPdfCargosGestao(cargos);
        enviarPdf(res, pdfDoc, 'Relatorio_Cargos_Gestao_Atual.pdf');
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório de cargos.", errorDetails: error.message }); }
};

export const gerarRelatorioDatasMaconicas = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    try {
        const membros = await db.LodgeMember.findAll({ where: { Situacao: 'Ativo' }, attributes: ['NomeCompleto', 'DataIniciacao', 'DataElevacao', 'DataExaltacao'] });
        let datasComemorativas = [];
        const normalizarData = (dataStr) => parseInt(dataStr.replace('-', ''), 10);
        const inicioNormalizado = normalizarData(dataInicio);
        const fimNormalizado = normalizarData(dataFim);
        const verificaIntervalo = (data) => {
            if (!data) return false;
            const dataNormalizada = parseInt(new Date(data).toISOString().substring(5, 10).replace('-', ''), 10);
            return inicioNormalizado <= fimNormalizado ? (dataNormalizada >= inicioNormalizado && dataNormalizada <= fimNormalizado) : (dataNormalizada >= inicioNormalizado || dataNormalizada <= fimNormalizado);
        };
        const anoAtual = new Date().getFullYear();
        membros.forEach(m => {
            if (verificaIntervalo(m.DataIniciacao)) datasComemorativas.push({ nome: m.NomeCompleto, data: new Date(m.DataIniciacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), tipo: 'Iniciação', anosComemorados: anoAtual - new Date(m.DataIniciacao).getFullYear() });
            if (verificaIntervalo(m.DataElevacao)) datasComemorativas.push({ nome: m.NomeCompleto, data: new Date(m.DataElevacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), tipo: 'Elevação', anosComemorados: anoAtual - new Date(m.DataElevacao).getFullYear() });
            if (verificaIntervalo(m.DataExaltacao)) datasComemorativas.push({ nome: m.NomeCompleto, data: new Date(m.DataExaltacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), tipo: 'Exaltação', anosComemorados: anoAtual - new Date(m.DataExaltacao).getFullYear() });
        });
        datasComemorativas.sort((a, b) => normalizarData(a.data.substring(3).replace('/', '-')) - normalizarData(b.data.substring(3).replace('/', '-')));
        const pdfDoc = gerarPdfDatasMaconicas(datasComemorativas, dataInicio.replace('-', '/'), dataFim.replace('-', '/'));
        enviarPdf(res, pdfDoc, `Relatorio_Datas_Maconicas_${dataInicio}_a_${dataFim}.pdf`);
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório de datas maçônicas.", errorDetails: error.message }); }
};

export const gerarRelatorioEmprestimos = async (req, res) => {
    const { tipo, livroId } = req.query;
    try {
        if (tipo === 'ativos') {
            const emprestimos = await db.Emprestimo.findAll({ where: { dataDevolucaoReal: null }, include: [{ model: db.Biblioteca, as: 'livro', attributes: ['titulo'] }, { model: db.LodgeMember, as: 'membro', attributes: ['NomeCompleto'] }], order: [['dataDevolucaoPrevista', 'ASC']] });
            const pdfDoc = gerarPdfEmprestimos(emprestimos, 'ativos');
            enviarPdf(res, pdfDoc, 'Relatorio_Emprestimos_Ativos.pdf');
        } else if (tipo === 'historico' && livroId) {
            const livro = await db.Biblioteca.findByPk(livroId);
            if (!livro) return res.status(404).json({ message: "Livro não encontrado." });
            const emprestimos = await db.Emprestimo.findAll({ where: { livroId: livroId }, include: [{ model: db.LodgeMember, as: 'membro', attributes: ['NomeCompleto'] }], order: [['dataEmprestimo', 'DESC']] });
            const pdfDoc = gerarPdfEmprestimos(emprestimos, 'historico', livro);
            enviarPdf(res, pdfDoc, `Relatorio_Historico_${livro.titulo.replace(/\s/g, '_')}.pdf`);
        } else {
            return res.status(400).json({ message: "Parâmetros inválidos. 'tipo' deve ser 'ativos' ou 'historico' (com 'livroId')." });
        }
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório da biblioteca.", errorDetails: error.message }); }
};

export const gerarRelatorioComissoes = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    try {
        const { Op } = db.Sequelize;
        const comissoes = await db.Comissao.findAll({ where: { [Op.or]: [{ dataInicio: { [Op.between]: [dataInicio, dataFim] } }, { dataFim: { [Op.between]: [dataInicio, dataFim] } }, { [Op.and]: [{ dataInicio: { [Op.lte]: dataInicio } }, { dataFim: { [Op.gte]: dataFim } }] }] }, include: [{ model: db.LodgeMember, as: 'membros', attributes: ['NomeCompleto'], through: { attributes: [] } }], order: [['nome', 'ASC']] });
        const dataInicioFmt = new Date(dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const dataFimFmt = new Date(dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const pdfDoc = gerarPdfComissoes(comissoes, dataInicioFmt, dataFimFmt);
        enviarPdf(res, pdfDoc, `Relatorio_Comissoes_${dataInicio}_a_${dataFim}.pdf`);
    } catch (error) { res.status(500).json({ message: "Erro ao gerar relatório de comissões.", errorDetails: error.message }); }
};

export const gerarRelatorioPatrimonio = async (req, res) => {
    try {
        const todosItens = await db.Patrimonio.findAll({
            order: [['nome', 'ASC']]
        });

        if (!todosItens || todosItens.length === 0) {
            return res.status(404).json({ message: 'Nenhum item de patrimônio encontrado para gerar o relatório.' });
        }

        const pdfDoc = gerarPdfPatrimonio(todosItens);
        enviarPdf(res, pdfDoc, `Relatorio_Patrimonio.pdf`);

    } catch (error) {
        console.error("Erro ao gerar relatório de patrimônio:", error);
        res.status(500).json({ message: "Erro ao gerar relatório de patrimônio.", errorDetails: error.message });
    }
};
