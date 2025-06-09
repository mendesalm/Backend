// scheduler.js
import cron from 'node-cron';
import {
  enviarAgendaSemanal,
  enviarAniversariantesSemanal,
  alertarSobreLivrosAtrasados,
} from './services/notification.service.js';

export const startScheduler = () => {
  console.log('Agendador de tarefas iniciado.');

  // Agenda para enviar emails semanais toda segunda-feira às 8:00 da manhã
  // Formato cron: 'minuto hora dia-do-mês mês dia-da-semana'
  cron.schedule('0 8 * * 1', () => {
    console.log('Executando tarefas semanais...');
    enviarAgendaSemanal();
    enviarAniversariantesSemanal();
  });

  // Agenda para verificar livros atrasados todos os dias às 9:00 da manhã
  cron.schedule('0 9 * * *', () => {
    console.log('Executando tarefa diária de verificação de livros atrasados...');
    alertarSobreLivrosAtrasados();
  });

  // Você pode adicionar outras tarefas agendadas aqui.
};
