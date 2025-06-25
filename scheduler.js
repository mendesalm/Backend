// scheduler.js
import cron from "node-cron";
// 1. Importação unificada e limpa do serviço de notificação
import * as notificationService from "./services/notification.service.js";

export const startScheduler = () => {
  console.log("Agendador de tarefas de e-mail iniciado.");

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
