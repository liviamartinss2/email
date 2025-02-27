const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const mysql = require("mysql");


const transport = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
        user: "AKIA3FRRIWSFZVI7I4N5",
        pass: "BNEqEPR2KrPh8+F9wBjjJTARFd6daOF23DPofi88OM3/",
    },
});


function processarCSV(caminhoCSV) {
    const usuarios = {};

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
        const linkChamado = `https://chamados.grupofan.com/front/ticket.form.php?id=${numeroChamado}`;

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
                                    <p>Os seguintes chamados foram <strong>Fechados recentemente:</strong></p>
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
const caminhoCSV = "./chamados.csv";
processarCSV(caminhoCSV);


const db = mysql.createConnection({
    host: "172.17.0.8",
    port: "3309",
    user: "tifan",
    password: "F4n@2025GlU$b",
    database: "glpidb"
});


const consultaSQL = `
    SELECT
    u.name AS nome_requerente,
    e.email AS email_requerente,	
    t.id AS numero_chamado,
    t.closedate AS data_fechamento,
    GREATEST(0, 7 - DATEDIFF(CURDATE(), t.closedate)) AS dias_avaliacao,
    form.id as ID_FORMULARIO
    FROM
    glpidb.glpi_tickets AS t
    JOIN glpidb.glpi_users AS u ON t.users_id_recipient = u.id
    JOIN glpidb.glpi_useremails e ON e.users_id = u.id
    JOIN glpidb.glpi_ticketsatisfactions s ON s.tickets_id = t.id
    LEFT JOIN glpi_plugin_formcreator_issues form ON t.id = form.items_id
    WHERE
    t.status = 6
    AND t.entities_id = 3
    and DATEDIFF(CURDATE(), closedate) <= 7
    AND s.satisfaction  IS NULL
    AND t.solvedate IS NOT NULL
    ORDER BY u.name, e.email
`;

function atualizarBanco() {
    console.log("⏳ Atualizando banco de dados...");

    db.query(consultaSQL, (err, resultados) => {
        if (err) {
            console.error("❌ Erro ao buscar dados do banco:", err);
            return;
        }

        
        const csvData = ["nome_requerente,email_requerente,numero_chamado,data_fechamento,dias_avaliacao,ID_FORMULARIO"];
        resultados.forEach(row => {
            csvData.push(`${row.nome_requerente},${row.email_requerente},${row.numero_chamado},${row.data_fechamento},${row.dias_avaliacao},${row.ID_FORMULARIO}`);
        });

        fs.writeFileSync("./chamados.csv", csvData.join("\n"));
        console.log("✔ Banco atualizado e CSV gerado.");
    });
}

//atualizarBanco(consultaSQL);
//processarCSV(caminhoCSV);



cron.schedule("0 7 * * *", () => {
    console.log(" Executando atualização do banco de dados às 7h...");
    atualizarBanco(consultaSQL);
});

cron.schedule("0 8 * * *", () => {
    console.log(" Enviando e-mails às 8h...");
    processarCSV(caminhoCSV);
});
// , { scheduled: true, immediate: true });

console.log("Sistema de automação iniciado...");