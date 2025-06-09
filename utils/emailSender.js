// backend/utils/emailSender.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Cria uma instância do transporter do Nodemailer.
 * Tenta usar as credenciais do .env para SMTP.
 * Se não estiverem configuradas e NODE_ENV for 'development', usa Ethereal.email para teste.
 * @returns {Promise<nodemailer.Transporter>}
 */
async function createTransporter() {
    const useRealSmtp = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (useRealSmtp) {
        console.log('Usando configuração SMTP real para envio de emails.');
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || "587", 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } else if (process.env.NODE_ENV === 'development') {
        console.warn('Variáveis de ambiente para email não configuradas. Usando Ethereal.email para desenvolvimento.');
        try {
            let testAccount = await nodemailer.createTestAccount();
            console.log('--------------------------------------------------------------------------------------');
            console.log('CONTA DE TESTE ETHEREAL CRIADA:');
            console.log(`Usuário Ethereal: ${testAccount.user}`);
            console.log(`Senha Ethereal: ${testAccount.pass}`);
            console.log('Uma URL de PREVIEW será exibida no console após o envio de cada email de teste.');
            console.log('--------------------------------------------------------------------------------------');

            return nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } catch (etherealError) {
            console.error('Falha ao criar conta de teste Ethereal:', etherealError);
            throw new Error('Falha ao configurar o serviço de email de desenvolvimento (Ethereal).');
        }
    } else {
        console.error('ERRO CRÍTICO: Configuração de email não encontrada para o ambiente de produção.');
        throw new Error('Serviço de email não configurado para produção.');
    }
}

/**
 * Envia um email.
 * @param {Object} mailDetails - Detalhes do email.
 * @param {string} mailDetails.to - Destinatário(s) do email.
 * @param {string} mailDetails.subject - Assunto do email.
 * @param {string} mailDetails.text - Corpo do email em texto puro.
 * @param {string} mailDetails.html - Corpo do email em HTML.
 * @returns {Promise<Object>} - Informações sobre o email enviado.
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"SysJPJ" <no-reply@sysjpj.com>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        };

        let info = await transporter.sendMail(mailOptions);
        console.log('Email enviado com sucesso: %s', info.messageId);

        if (transporter.options && transporter.options.host === 'smtp.ethereal.email') {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('Preview URL (Ethereal): %s', previewUrl);
            }
        }
        return info;
    } catch (error) {
        console.error('Erro detalhado ao enviar email:', error);
        throw new Error(`Falha no serviço de envio de email. Detalhes: ${error.message}`);
    }
};

export default sendEmail;
