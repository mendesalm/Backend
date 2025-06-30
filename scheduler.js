import { Op } from "sequelize";
import db from "./models/index.js";
import cron from "node-cron";
import * as notificationService from "./services/notification.service.js";

/**
 * Atualiza o status de sessões passadas de 'Agendada' para 'Realizada'.
 */
const atualizarStatusSessoes = async () => {
  console.log(
    "[Scheduler] Executando tarefa para atualizar status de sessões..."
  );
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas a data

    const sessoesParaAtualizar = await db.MasonicSession.findAll({
      where: {
        status: "Agendada",
        dataSessao: {
          [Op.lt]: hoje,
        },
      },
    });

    if (sessoesParaAtualizar.length > 0) {
      const ids = sessoesParaAtualizar.map((s) => s.id);
      await db.MasonicSession.update(
        { status: "Realizada" },
        { where: { id: { [Op.in]: ids } } }
      );
      console.log(
        `[Scheduler] ${sessoesParaAtualizar.length} sessões foram atualizadas para 'Realizada'.`
      );
    } else {
      console.log("[Scheduler] Nenhuma sessão para atualizar.");
    }
  } catch (error) {
    console.error("[Scheduler] Erro ao atualizar status das sessões:", error);
  }
};

export const startScheduler = () => {
  console.log("Agendador de tarefas iniciado.");

  // Tarefa para atualizar status das sessões (diariamente à 01:00)
  cron.schedule("0 1 * * *", atualizarStatusSessoes, {
    timezone: "America/Sao_Paulo",
  });

  // --- TAREFA DIÁRIA UNIFICADA (08:00) ---
  cron.schedule(
    "0 8 * * *", // Todos os dias às 8:00 da manhã
    async () => {
      console.log("[Scheduler] Executando tarefas diárias de aniversário...");
      try {
        await notificationService.notificarAniversariantesDoDiaComCartao();
        await notificationService.notificarAniversariosMaconicos();
        console.log("[Scheduler] Tarefas diárias de aniversário concluídas.");
      } catch (error) {
        console.error(
          "[Scheduler] Erro ao executar tarefas diárias de aniversário:",
          error
        );
      }
    },
    {
      scheduled: true,
      timezone: "America/Sao_Paulo",
    }
  );

  // --- TAREFA SEMANAL (Segunda-feira às 09:00) ---
  cron.schedule(
    "0 9 * * 1",
    () => {
      console.log("[Scheduler] Executando verificação semanal de ausências...");
      notificationService.verificarAusenciasConsecutivas();
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );

  // --- TAREFA SEMANAL (Quarta-feira às 18:00) ---
  cron.schedule(
    "0 18 * * 3",
    () => {
      console.log(
        "[Scheduler] Executando convocação para a sessão da semana..."
      );
      notificationService.enviarConvocacaoSessaoColetiva();
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );
};

// --- TAREFA DIÁRIA UNIFICADA (08:00) ---
cron.schedule(
  "0 8 * * *", // Todos os dias às 8:00 da manhã
  async () => {
    console.log("[Scheduler] Executando tarefas diárias de aniversário...");
    try {
      // 2. CORREÇÃO: Chama a função correta que gera o cartão E envia o e-mail
      await notificationService.notificarAniversariantesDoDiaComCartao();

      // 3. Chama a função que verifica os aniversários maçônicos
      await notificationService.notificarAniversariosMaconicos();

      console.log("[Scheduler] Tarefas diárias de aniversário concluídas.");
    } catch (error) {
      console.error(
        "[Scheduler] Erro ao executar tarefas diárias de aniversário:",
        error
      );
    }
  },
  {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  }
);

// --- TAREFA SEMANAL (Segunda-feira às 09:00) ---
cron.schedule(
  "0 9 * * 1",
  () => {
    console.log("[Scheduler] Executando verificação semanal de ausências...");
    notificationService.verificarAusenciasConsecutivas();
  },
  {
    timezone: "America/Sao_Paulo",
  }
);

// --- TAREFA SEMANAL (Quarta-feira às 18:00) ---
cron.schedule(
  "0 18 * * 3",
  () => {
    console.log("[Scheduler] Executando convocação para a sessão da semana...");
    notificationService.enviarConvocacaoSessaoColetiva();
  },
  {
    timezone: "America/Sao_Paulo",
  }
);
