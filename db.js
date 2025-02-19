const mysql = require('mysql2');
 
const connection = mysql.createConnection({
    host: "172.17.0.8",
    port: "3309",
    user: "tifan",
    password: "F4n@2025GlU$b",
    database: "glpidb"       
});
 

// Conectar ao banco
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MariaDB:', err);
        return;
    }
    console.log('Conectado ao MariaDB com sucesso!');
});
 
module.exports = connection;