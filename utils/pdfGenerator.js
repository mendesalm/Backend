// utils/pdfGenerator.js
import PdfPrinter from 'pdfmake';

// Definição das fontes padrão da biblioteca.
const fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

const printer = new PdfPrinter(fonts);

// Função auxiliar para criar o cabeçalho padrão dos relatórios
const criarCabecalhoRelatorio = (titulo, subtitulo) => {
    return [
        { text: `Relatório - Loja SysJPJ`, style: 'header' },
        { text: titulo, style: 'subheader' },
        { text: subtitulo, style: 'body' },
    ];
};

const estilosPadrao = {
    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
    subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
    body: { fontSize: 10, margin: [0, 0, 0, 15], italics: true, alignment: 'center' },
    tableHeader: { bold: true, fontSize: 11, color: 'black' },
    tableBody: { fontSize: 10 }
};

const layoutTabela = {
    fillColor: function (rowIndex, node, columnIndex) {
        return (rowIndex % 2 === 0) ? '#EAEAEA' : null;
    }
};

// --- FUNÇÕES DE GERAÇÃO DE PDF ---

export function gerarPdfBalancete(dadosBalancete, lancamentos) {
    // ... (código existente para o balancete)
}

export function gerarPdfFrequencia(dados, dataInicio, dataFim) {
    const corpoTabela = dados.map(item => [ item.nome, `${item.presencas} de ${item.totalSessoes}`, `${item.percentual.toFixed(2)}%` ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Relatório de Frequência', `Período de ${dataInicio} a ${dataFim}`), { table: { headerRows: 1, widths: ['*', 'auto', 'auto'], body: [[{ text: 'Membro', style: 'tableHeader' }, { text: 'Presenças', style: 'tableHeader' }, { text: 'Percentual', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfVisitacoes(dados, dataInicio, dataFim) {
    const corpoTabela = dados.map(visita => [ visita.visitante.NomeCompleto, new Date(visita.dataSessao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}), visita.lojaVisitada, visita.orienteLojaVisitada ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Relatório de Visitações', `Período de ${dataInicio} a ${dataFim}`), { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: [[{ text: 'Membro Visitante', style: 'tableHeader' }, { text: 'Data', style: 'tableHeader' }, { text: 'Loja Visitada', style: 'tableHeader' }, { text: 'Oriente', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfMembros(membros) {
    const corpoTabela = membros.map(membro => [ membro.NomeCompleto, membro.CIM || 'N/A', membro.Graduacao || 'N/A', membro.Situacao || 'N/A' ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Quadro de Obreiros Ativos', `Gerado em ${new Date().toLocaleDateString('pt-BR')}`), { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: [[{ text: 'Nome Completo', style: 'tableHeader' }, { text: 'CIM', style: 'tableHeader' }, { text: 'Grau', style: 'tableHeader' }, { text: 'Situação', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfAniversariantes(dados, dataInicio, dataFim) {
    const corpoTabela = dados.map(aniv => [ aniv.nome, aniv.dataAniversario, aniv.tipo, aniv.relacionadoA || '-' ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Relatório de Aniversariantes', `Período de ${dataInicio} a ${dataFim}`), { table: { headerRows: 1, widths: ['*', 'auto', 'auto', '*'], body: [[{ text: 'Nome', style: 'tableHeader' }, { text: 'Data', style: 'tableHeader' }, { text: 'Tipo', style: 'tableHeader' }, { text: 'Membro Relacionado', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfFinanceiroDetalhado(conta, lancamentos, dataInicio, dataFim) {
    const corpoTabela = lancamentos.map(lanc => [ new Date(lanc.dataLancamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}), lanc.descricao, lanc.membroAssociado ? lanc.membroAssociado.NomeCompleto : 'N/A', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lanc.valor) ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio(`Extrato Detalhado da Conta: ${conta.nome}`, `Período de ${dataInicio} a ${dataFim}`), { table: { headerRows: 1, widths: ['auto', '*', '*', 'auto'], body: [[{ text: 'Data', style: 'tableHeader' }, { text: 'Descrição', style: 'tableHeader' }, { text: 'Membro Associado', style: 'tableHeader' }, { text: 'Valor', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfCargosGestao(cargos) {
    const corpoTabela = cargos.map(cargo => [ cargo.nomeCargo, cargo.LodgeMember.NomeCompleto, new Date(cargo.dataInicio).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Quadro de Cargos da Gestão Atual', `Gerado em ${new Date().toLocaleDateString('pt-BR')}`), { table: { headerRows: 1, widths: ['*', '*', 'auto'], body: [[{ text: 'Cargo', style: 'tableHeader' }, { text: 'Ocupante', style: 'tableHeader' }, { text: 'Data de Início', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfDatasMaconicas(dados, dataInicio, dataFim) {
    const corpoTabela = dados.map(item => [ item.nome, item.data, item.tipo, item.anosComemorados ]);
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Relatório de Datas Maçônicas', `Período de ${dataInicio} a ${dataFim}`), { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: [[{ text: 'Membro', style: 'tableHeader' }, { text: 'Data', style: 'tableHeader' }, { text: 'Comemoração', style: 'tableHeader' }, { text: 'Anos', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfEmprestimos(emprestimos, tipoRelatorio, dadosLivro = null) {
    const corpoTabela = emprestimos.map(e => {
        const dataDevolucao = e.dataDevolucaoReal ? new Date(e.dataDevolucaoReal).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : (e.status === 'Atrasado' ? { text: 'ATRASADO', color: 'red', bold: true } : 'Emprestado');
        return [ tipoRelatorio === 'ativos' ? e.livro.titulo : e.membro.NomeCompleto, new Date(e.dataEmprestimo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}), new Date(e.dataDevolucaoPrevista).toLocaleDateString('pt-BR', {timeZone: 'UTC'}), dataDevolucao ];
    });
    const cabecalhoColuna1 = tipoRelatorio === 'ativos' ? 'Livro' : 'Membro';
    const subtitulo = tipoRelatorio === 'ativos' ? 'Empréstimos Ativos e Atrasados' : `Histórico do Livro: ${dadosLivro.titulo}`;
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Relatório da Biblioteca', subtitulo), { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: [[{ text: cabecalhoColuna1, style: 'tableHeader' }, { text: 'Data Empréstimo', style: 'tableHeader' }, { text: 'Devolução Prevista', style: 'tableHeader' }, { text: 'Devolução Real', style: 'tableHeader' }], ...corpoTabela] }, layout: layoutTabela } ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfComissoes(comissoes, dataInicio, dataFim) {
    const comissoesContent = comissoes.map(comissao => {
        const membrosText = comissao.membros.map(membro => `\t• ${membro.NomeCompleto}`).join('\n');
        return [ { text: comissao.nome, style: 'subheader', margin: [0, 15, 0, 5] }, { text: comissao.descricao, italics: true, margin: [0, 0, 0, 5] }, { text: `Membros:\n${membrosText}` } ];
    });
    const docDefinition = {
        content: [ ...criarCabecalhoRelatorio('Relatório de Comissões', `Comissões ativas no período de ${dataInicio} a ${dataFim}`), ...comissoesContent.flat() ],
        styles: estilosPadrao, defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}

export function gerarPdfPatrimonio(patrimonios) {
    const corpoTabela = patrimonios.map(item => [
        item.nome,
        new Date(item.dataAquisicao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorAquisicao),
        item.estadoConservacao,
        item.localizacao || 'N/A'
    ]);

    const docDefinition = {
        content: [
            ...criarCabecalhoRelatorio('Relatório de Inventário de Patrimônio', `Gerado em ${new Date().toLocaleDateString('pt-BR')}`),
            {
                style: { margin: [0, 5, 0, 15] },
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                        [{ text: 'Nome do Bem', style: 'tableHeader' }, { text: 'Data Aquisição', style: 'tableHeader' }, { text: 'Valor', style: 'tableHeader' }, { text: 'Estado', style: 'tableHeader' }, { text: 'Localização', style: 'tableHeader' }],
                        ...corpoTabela
                    ]
                },
                layout: layoutTabela
            }
        ],
        styles: estilosPadrao,
        defaultStyle: { fontSize: 10 }
    };
    return printer.createPdfKitDocument(docDefinition);
}