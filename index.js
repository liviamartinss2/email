const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require('nodemailer')
const mysql = require("mysql2"); // Biblioteca para conectar ao MySQL
const cron = require("node-cron");

const transport = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
        user: 'AKIA3FRRIWSFZVI7I4N5',
        pass: 'BNEqEPR2KrPh8+F9wBjjJTARFd6daOF23DPofi88OM3/',
    }
});

// // Função para processar o CSV e agrupar os chamados por e-mail
// function processarCSV(caminhoCSV) {
//   const usuarios = {}; // Objeto para agrupar chamados por e-mail

//   fs.createReadStream(caminhoCSV)
//     .pipe(csv())
//     .on("data", (row) => {
//       const nome = row["nome_requerente"];
//       const email = row["email_requerente"];
//       const numeroChamado = row["numero_chamado"];

//       if (!usuarios[email]) {
//         usuarios[email] = { nome, chamados: [] };
//       }

//       usuarios[email].chamados.push(numeroChamado);
//     })
//     .on("end", () => {
//       console.log("✔ Processamento do CSV concluído.");

//       // Enviar um único e-mail para cada usuário
//       for (const email in usuarios) {
//         const { nome, chamados } = usuarios[email];
//         enviarEmail(nome, email, chamados);
//       }
//     });
// }

// Executar o script com o caminho do CSV
const caminhoCSV = ""; // ./chamados.csv
processarCSV(caminhoCSV);


// Configuração do banco de dados
const connection = mysql.createConnection({
  host: "localhost", // Altere se necessário
  user: "root",
  password: "sua_senha",
  database: "glpidb",
});

// 🔹 Função para buscar dados no banco e salvar no CSV
function atualizarBanco() {
  console.log("🔄 Atualizando banco de dados...");

  const query = `
    SELECT
      u.name AS nome_requerente,
      e.email AS email_requerente,	
      t.id AS numero_chamado,
      t.closedate AS data_fechamento,
      DATEDIFF(CURDATE(), t.closedate) AS dias_avaliacao    
    FROM glpidb.glpi_tickets AS t
    JOIN glpidb.glpi_users AS u ON t.users_id_recipient = u.id
    JOIN glpidb.glpi_useremails e ON e.users_id = u.id
    JOIN glpidb.glpi_ticketsatisfactions s ON s.tickets_id = t.id
    WHERE t.status = 6
    AND t.entities_id = 3
    AND DATEDIFF(CURDATE(), t.closedate) <= 7
    AND s.satisfaction IS NULL
    AND t.solvedate IS NOT NULL
    ORDER BY u.name, e.email;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar dados:", err);
      return;
    }

    // Salvar os dados em um arquivo CSV
    const csvFilePath = "./chamados.csv";
    const csvContent = [
      "nome_requerente,email_requerente,numero_chamado,data_fechamento,dias_avaliacao",
      ...results.map(row =>
        `${row.nome_requerente},${row.email_requerente},${row.numero_chamado},${row.data_fechamento},${row.dias_avaliacao}`
      ),
    ].join("\n");

    fs.writeFileSync(csvFilePath, csvContent);
    console.log("✔ Banco atualizado e CSV salvo!");
  });
}

// 🔹 Função para processar o CSV e enviar os e-mails
function processarCSV() {
  console.log("📩 Processando CSV e enviando e-mails...");

  const usuarios = {};

  fs.createReadStream("./chamados.csv")
    .pipe(csv())
    .on("data", (row) => {
      const nome = row["nome_requerente"];
      const email = row["email_requerente"];
      const numeroChamado = row["numero_chamado"];

      if (!usuarios[email]) {
        usuarios[email] = { nome, chamados: [] };
      }

      usuarios[email].chamados.push(numeroChamado);
    })
    .on("end", () => {
      for (const email in usuarios) {
        const { nome, chamados } = usuarios[email];
        enviarEmail(nome, email, chamados);
      }
    });
}

// Função para enviar um único e-mail listando todos os chamados
async function enviarEmail(nome, email, chamados) {
    const listaChamados = chamados.map((chamado) => `<li>Chamado #${chamado}</li>`).join("");
  
    const mailOptions = {
      from: '"Suporte da Plataforma" <seuemail@dominio.com>',
      to: email,
      subject: `Lembrete: Avaliação dos seus chamados`,
      html: `
        <p>Olá, <strong>${nome}</strong>,</p>
        <p>Esperamos que esteja tudo bem com você! 😊</p>
        <p>Os seguintes chamados foram encerrados recentemente:</p>
        <ul>${listaChamados}</ul>
        <p>,e gostaríamos muito de saber como foi sua experiência.</br> Seu feedback nos ajuda a melhorar cada vez mais!</p>
        <p>Poderia nos dar um feedback sobre o atendimento?</p>
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
      await transporter.sendMail(mailOptions);
      console.log(`✔ E-mail enviado para ${email} com ${chamados.length} chamados.`);
    } catch (error) {
      console.error(`❌ Erro ao enviar e-mail para ${email}:`, error);
    }
  }

// 🔹 Agendar tarefas com node-cron
cron.schedule("0 6 * * *", () => {
  console.log("⏳ Executando tarefa das 06:00...");
  atualizarBanco();
});

cron.schedule("0 7 * * *", () => {
  console.log("⏳ Executando tarefa das 07:00...");
  processarCSV();
});

// 🔹 Iniciar o script e rodar imediatamente para testar
console.log("✅ Sistema de agendamento iniciado!");
atualizarBanco();
setTimeout(processarCSV, 60000); // Aguarda 1 minuto e depois executa o envio

// 