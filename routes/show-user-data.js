const express = require('express');
const showUserData = express();

const mysqlDB = require('../mysql-db');

showUserData.get('/', function (req, res, next) {
  mysqlDB.query('select * from users', function(err, rows, fields) {
    if(!err) {
      console.log(rows);
      console.log(fields);
      let result = 'rows : ' + JSON.stringify(rows) + '<br><br>' +
        'fields : ' + JSON.stringify(fields);
      res.send(result);
    } else {
      console.log('query error : ' + err);
      res.send(err);
    }
  })
});

module.exports = showUserData;