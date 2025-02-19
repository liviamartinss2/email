var Service = require('node-windows').Service;

// Cria um novo objeto de serviço
var svc = new Service({
  name:'FAN - ENVIO EMAIL GLPI PESQUISA',
  description: 'API para retorno de informação para o Portal Cliente',
  script: "C:\\Users\\livia.martins\\email\\index.js"
});

// Evento "install" para ouvir quando a instalação estiver concluída
svc.on('install', function(){
  console.log('O serviço foi criado com sucesso.');
  svc.start();
});

// Evento "error" para ouvir se ocorrer algum erro durante a instalação
svc.on('error', function(err){
  console.log('Erro ao criar o serviço:', err.message);
});

// Instala o serviço
svc.install();