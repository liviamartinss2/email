const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: 'livia.martins@grupofan.com',
        pass: '4002Livi@',
    }
});

transport.sendMail({
    from: 'Livia <livia.martins@grupofan.com>',
    to: 'livia.martins@grupofan.com',
    subject: 'Enviando email para voce',
    html: '<h1>Olá, Dev!</h1> <p>Esse email foi enviado pelo nodemailer</p>',
    text: 'Olá, Dev! esse email foi enviado pelo nodemailer',
})
.then((response) => console.log('Email enviado com sucesso!'))
.catch((err) => console.log('Erro ao enviar email: '+ err))