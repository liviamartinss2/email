var Service = require('node-windows').Service;


var svc = new Service({
  name:'FAN - ENVIO EMAIL GLPI PESQUISA',
  description: 'API para retorno de informação para o Portal Cliente',
  script: "C:\\Users\\livia.martins\\email\\index.js"
});


svc.on('install', function(){
  console.log('O serviço foi criado com sucesso.');
  svc.start();
});


svc.on('error', function(err){
  console.log('Erro ao criar o serviço:', err.message);
});


svc.install();