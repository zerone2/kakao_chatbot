const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  post: 3306,
  user: 'root',
  password: '',
  database: 'zipadvisor_user'
});

module.exports = connection;