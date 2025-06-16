"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "MensagemTemplates",
      [
        {
          eventoGatilho: "ANIVERSARIO_MEMBRO",
          canal: "EMAIL",
          assunto: "Feliz Aniversário, Ir.·. {{NomeCompleto}}!",
          corpo:
            "<h1>Feliz Aniversário!</h1><p>Prezado Irmão {{NomeCompleto}},</p><p>A Loja Maçônica João Pedro Junqueira nº 2181 e todos os seus obreiros lhe desejam um feliz e abençoado aniversário! Que o Supremo Arquiteto do Universo ilumine sempre o seu caminho.</p><p>Receba nosso Tríplice e Fraternal Abraço.</p>",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          eventoGatilho: "ANIVERSARIO_FAMILIAR",
          canal: "EMAIL",
          assunto: "Felicitações à sua Família!",
          corpo:
            "<p>Prezado Ir.·. {{NomeCompleto}},</p><p>Hoje celebramos com alegria o aniversário de seu(sua) familiar <strong>{{familiar.nomeCompleto}} ({{familiar.parentesco}})</strong>.</p><p>A família João Pedro Junqueira deseja a ele(a) um dia repleto de felicidades e saúde. Por favor, transmita nossos votos!</p><p>TFA.</p>",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          eventoGatilho: "ANIVERSARIO_MACONICO",
          canal: "EMAIL",
          assunto:
            "Feliz Aniversário de {{tipoAniversario}}, Ir.·. {{NomeCompleto}}!",
          corpo:
            "<p>Prezado Irmão {{NomeCompleto}},</p><p>Hoje celebramos com grande alegria seus <strong>{{anos}} anos</strong> de dedicação à Maçonaria, marcados por sua <strong>{{tipoAniversario}}</strong>.</p><p>Sua jornada é uma inspiração para todos nós. Que o Supremo Arquiteto do Universo continue a guiar seus passos.</p><p>TFA.</p>",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          eventoGatilho: "CADASTRO_APROVADO",
          canal: "EMAIL",
          assunto: "Seu cadastro na plataforma SysJPJ foi aprovado!",
          corpo:
            "<p>Prezado Ir.·. {{NomeCompleto}},</p><p>Temos a satisfação de informar que seu cadastro em nossa plataforma foi aprovado. Você já pode acessar o sistema com o e-mail e senha que definiu.</p><p>Seja bem-vindo!</p>",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          eventoGatilho: "AVISO_AUSENCIA_CONSECUTIVA",
          canal: "EMAIL",
          assunto: "Sentimos sua falta, Ir.·. {{NomeCompleto}}",
          corpo:
            "<p>Prezado Ir.·. {{NomeCompleto}},</p><p>Notamos com atenção sua ausência em nossas últimas reuniões. Esperamos sinceramente que esteja tudo bem com você e sua família.</p><p>Sua presença e contribuição são de grande valor para a nossa Loja. Se houver algo em que possamos ajudar, ou se desejar conversar, por favor, não hesite em nos contatar.</p><p>Com um Tríplice e Fraternal Abraço.</p>",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          eventoGatilho: "CONVOCACAO_SESSAO_COLETIVA",
          canal: "EMAIL",
          assunto: "Convocação para Sessão - {{sessao.data}}",
          corpo:
            "<h3>L.·.S.·.T.·.</h3><p>Prezados IIr.·.,</p><p>Ficam todos convocados para nossa Sessão {{sessao.tipoSessao}} no Grau de {{sessao.subtipoSessao}}, a ser realizada na próxima <strong>{{sessao.data}}</strong>, às 19h30.</p><p>A presença de todos é fundamental para a força de nossa Loja.</p><p>TFA.</p>",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("MensagemTemplates", null, {});
  },
};
