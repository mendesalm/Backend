// utils/emailSender.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configura e cria um "transporter" do Nodemailer usando as credenciais do Gmail
 * definidas nas variáveis de ambiente.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: true, // `true` para a porta 465, `false` para outras como a 587
  auth: {
    user: process.env.EMAIL_USER, // O seu e-mail do Gmail
    pass: process.env.EMAIL_PASS, // A sua senha de app de 16 dígitos
  },
});

/**
 * Função principal para enviar um e-mail.
 * @param {object} mailOptions - Objeto com as opções de e-mail.
 * @param {string} mailOptions.to - O destinatário ou uma lista de destinatários separados por vírgula.
 * @param {string} mailOptions.subject - O assunto do e-mail.
 * @param {string} mailOptions.html - O corpo do e-mail em formato HTML.
 * @param {Array<object>} [mailOptions.attachments] - Um array opcional de anexos.
 */
export const sendEmail = async (mailOptions) => {
  try {
    // Define opções padrão, como o remetente
    const options = {
      from: `"<span class="math-inline">\{process\.env\.APP\_NAME \|\| 'SysJPJ'\}" <</span>{process.env.EMAIL_USER}>`,
      ...mailOptions,
    };

    // Envia o e-mail
    const info = await transporter.sendMail(options);
    console.log(`[EmailSender] E-mail enviado com sucesso: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[EmailSender] Falha ao enviar o e-mail:", error);
    // Em um ambiente de produção, você poderia lançar o erro
    // ou usar um sistema de logging mais robusto.
    throw new Error("Não foi possível enviar o e-mail.");
  }
};

// Exportação padrão para compatibilidade, se necessário
export default sendEmail;
