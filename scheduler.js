// scheduler.js
import cron from "node-cron";
import * as notificationService from "./services/notification.service.js";

export const startScheduler = () => {
  console.log("Agendador de tarefas de e-mail iniciado.");

  // Todos os dias às 8:00 da manhã
  cron.schedule(
    "0 8 * * *",
    () => {
      console.log("[Scheduler] Executando tarefas diárias de aniversário...");
      notificationService.notificarAniversariantesDoDia();
      notificationService.notificarAniversariosMaconicos();
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );

  // Toda segunda-feira às 9:00 da manhã
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

  // Toda quarta-feira às 18:00
  cron.schedule(
    "0 18 * * 3",
    () => {
      console.log(
        "[Scheduler] Executando convocação para a sessão de sexta-feira..."
      );
      notificationService.enviarConvocacaoSessaoColetiva();
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );
};
