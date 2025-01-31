const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
        user: 'AKIA3FRRIWSFZVI7I4N5',
        pass: 'BNEqEPR2KrPh8+F9wBjjJTARFd6daOF23DPofi88OM3/',
    }
});

// Função para enviar e-mails
async function enviarEmail(nome, email, numeroChamado) {
  const mailOptions = {
    from: '"🚨 Avaliação GLPI" <livia.martins@grupofan.com>',
    to: email, //colocar email depois, sem aspas
    subject: `Lembrete: Avaliação do chamado #${numeroChamado}`,
    html: `
      <p>Olá, <strong>${nome}</strong>,</p>
      <p>Esperamos que esteja tudo bem com você! 😊</p>
      <p>Seu chamado <strong>#${numeroChamado}</strong> foi encerrado recentemente, e gostaríamos muito de saber como foi sua experiência. Seu feedback nos ajuda a melhorar cada vez mais!</p>
      <p>Para avaliar, é bem simples:</p>
      <p>⭐ Clique na aba <strong>Satisfação</strong></p>
      <p>⭐ Escolha a quantidade de estrelas de acordo com o atendimento recebido, e escreva sua mensagem.</p>
      <p>Basta alguns segundos, mas faz toda a diferença para nós! ❤️</p>
      <p><a href="https://chamados.grupofan.com/plugins/formcreator/front/issue.form.php?id=${numeroChamado}&tickets_id=${numeroChamado}" style="martin-top: 4px; martin-botton: 4px; padding:10px 15px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:5px;">Avaliar Atendimento</a></p>
      <p>Obrigado pela atenção!</p>
      <p>Atenciosamente,</p>
      <p>Equipe de TI</p>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.log(`✔ E-mail enviado para ${email}`);
  } catch (error) {
    console.error(`❌ Erro ao enviar e-mail para ${email}:`, error);
  }
}

// Função para processar o arquivo CSV e enviar os e-mails
function processarCSV(caminhoCSV) {
  fs.createReadStream(caminhoCSV)
    .pipe(csv())
    .on("data", (row) => {
      const nome = row["nome_requerente"];
      const email = row["email_requerente"];
      const numeroChamado = row["numero_chamado"];

      if (email) {
        enviarEmail(nome, email, numeroChamado);
      }
    })
    .on("end", () => {
      console.log("✅ Processamento do CSV concluído.");
    });
}

// Executar o script com o caminho do CSV
const caminhoCSV = "./chamados.csv"; // Altere para o caminho correto
processarCSV(caminhoCSV);
