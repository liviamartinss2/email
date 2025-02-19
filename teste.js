const db = require('./db');
 
db.query('SELECT name FROM glpi_users LIMIT 5', (err, results) => {
    if (err) {
        console.error('Erro ao executar consulta:', err);
        return;
    }
    console.log('Usuários do GLPI:', results);
    db.end(); // Fecha a conexão após a consulta
});