const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
        user: "AKIA3FRRIWSFZVI7I4N5",
        pass: "BNEqEPR2KrPh8+F9wBjjJTARFd6daOF23DPofi88OM3/",
    },
});

// Função para processar o CSV e agrupar os chamados por e-mail
function processarCSV(caminhoCSV) {
    const usuarios = {}; // Objeto para agrupar chamados por e-mail

    fs.createReadStream(caminhoCSV)
        .pipe(csv())
        .on("data", (row) => {
            const nome = row["nome_requerente"];
            const email = row["email_requerente"];
            const numeroChamado = row["numero_chamado"];
            const dataFechamento = row["data_fechamento"];
            const diasAvaliacao = row["dias_avaliacao"];
            const idForm = row["ID_FORMULARIO"]

            if (!usuarios[email]) {
                usuarios[email] = { nome, chamados: [] };
            }

            usuarios[email].chamados.push({ numeroChamado, dataFechamento, diasAvaliacao, idForm });
        })
        .on("end", () => {
            console.log("✔ Processamento do CSV concluído.");

            // Enviar um único e-mail para cada usuário
            for (const email in usuarios) {
                const { nome, chamados } = usuarios[email];
                enviarEmail(nome, email, chamados);
            }
        });
}

// Função para enviar um único e-mail listando todos os chamados
async function enviarEmail(nome, email, chamados) {
    const tabelaChamados = chamados.map(({ numeroChamado, dataFechamento, diasAvaliacao, idForm }) => {
        const linkChamado = `https://chamados.grupofan.com/plugins/formcreator/front/issue.form.php?id=${idForm}&tickets_id=${numeroChamado}`; // Altere conforme necessário

        return `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">#${numeroChamado}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${dataFechamento}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${diasAvaliacao}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <a href="${linkChamado}" target="_blank" style="text-decoration: none; color: #a4262c; padding: 5px 10px; display: inline-block;">Acessar</a>
            </td>
        </tr>
        `;
    }).join("");

    const mailOptions = {
        from: '"Equipe de TI - Grupo Fan" <livia.martins@grupofan.com>',
        to: email,
        subject: `🚨 Avaliação dos seus chamados`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
            <title>Email de Feedback</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background-color: #ffc5c5;">

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffc5c5">
                <tr>
                    <td align="center">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f4f4" style="margin: 30px; padding: 20px; border-radius: 8px;">
                            
                            <!-- Saudação -->
                            <tr>
                                <td align="left" style="font-size: 16px; color: #333;">
                                    <p>Olá, <strong>${nome}</strong>,</p>
                                    <p>Esperamos que esteja tudo bem com você! 😊</p>
                                    <p>Os seguintes chamados foram encerrados recentemente:</p>
                                </td>
                            </tr>

                            <!-- Tabela de Chamados -->
                            <tr>
                                <td align="center">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="1" style="border-collapse: collapse; margin: 20px 0;">
                                        <thead>
                                            <tr style="background-color: #a4262c; color: #fff;">
                                                <th style="padding: 10px; border: 1px solid #ddd;">Chamado</th>
                                                <th style="padding: 10px; border: 1px solid #ddd;">Data de Fechamento</th>
                                                <th style="padding: 10px; border: 1px solid #ddd;">Dias para Avaliação</th>
                                                <th style="padding: 10px; border: 1px solid #ddd;">Link</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${tabelaChamados}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <!-- Como avaliar -->
                            <tr>
                                <td align="left" style="font-size: 16px; color: #333;">
                                    <p>Poderia nos dar um feedback sobre o atendimento?</p>
                                    <p>Para avaliar, é bem simples:</p>
                                    <ul style="margin: 10px 0; padding-left: 20px; color: #555;">
                                        <li>⭐ Clique em <strong>Meus chamados</strong>, e escolha o chamado que deseja avaliar</li>
                                        <li>⭐ Clique na aba <strong>Satisfação</strong></li>
                                        <li>⭐ Escolha a quantidade de estrelas de acordo com o atendimento recebido, e escreva sua mensagem.</li>
                                    </ul>
                                    <p>Basta alguns segundos, mas faz toda a diferença para nós! ❤️</p>
                                </td>
                            </tr>

                            <!-- Assinatura -->
                            <tr>
                                <td align="left" style="font-size: 16px; color: #333;">
                                    <p>Obrigado pela atenção!</p>
                                    <p>Atenciosamente,</p>
                                    <p><strong>Equipe de TI</strong></p>
                                </td>
                            </tr>

                            <!-- Logo -->
                            <tr>
                                <td align="center" style="padding-top: 20px;">
                                    <img src="https://lirp.cdn-website.com/c662d39f/dms3rep/multi/opt/GRUPO+FAN-8e48a3b5-640w.png" alt="Logo da Empresa" width="150" style="display: block;"/>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>

        </body>
        </html>
    `
    };

    try {
        await transport.sendMail(mailOptions);
        console.log(`✔ E-mail enviado para ${email} com ${chamados.length} chamados.`);
    } catch (error) {
        console.error(`❌ Erro ao enviar e-mail para ${email}:`, error);
    }
}

// Executar o script com o caminho do CSV
const caminhoCSV = "./chamados.csv"; // Altere para o caminho correto
processarCSV(caminhoCSV);

