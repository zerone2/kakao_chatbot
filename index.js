const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// const session = require('express-session');
const mysqlDB = require('./mysql-db');
// mysqlDB.connect();
// const FileStore = require('session-file-store')(session);
/*const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
mongoose.connect('mongodb://localhost/zipadvisor_user');
const db = mongoose.connection;

db.once('err', () => {
  console.log(err);
});
db.once('open', () => {
  console.log('DB connected');
});

const UserSchema = mongoose.Schema({
  num: Number,
  key: String,
  authority: String,
  address: String,
  acquiredDate: String,
  acquiredPrice: Number
});
const User = mongoose.model('user', UserSchema);*/

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
/*app.use(session({
  secret: 'zipfund@zipfund.co', // 암호화
  resave: false,
  saveUninitialized: true,
  /!*store: new MongoStore({
    url: "mongodb://localhost/zipadvisor_user",
    collection: "sessions"
  })*!/
}));*/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dbtest', (req, res) => {
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

app.get('/keyboard', (req, res) => {  // 최초
  let answer = {
    "type" : "buttons",
    "buttons" : ["시뮬레이터", "투자분석하기"]
  };
  res.send(answer);
});

app.post('/message', (req, res) => {  // 사용자 메시지 입력
  let user_key = decodeURIComponent(req.body.user_key);
  let type = decodeURIComponent(req.body.type);
  let content = decodeURIComponent(req.body.content);
  console.log(`user key : ${user_key.toString()}`);
  // console.log(type);
  // console.log(content);
  // console.log(req.session);

  // req.session.user_key = user_key;
  // req.session.userSelect = content;
  // req.session.userStatus = "true";
  let answer = {
    "message": {
      "text": content
    },
    "keyboard": {
      "type": "buttons",
      "buttons": ["계속 진행", "나가기"]
    }
  };
  //answer = checkUser(user_key);
  checkUser(user_key, (err, content) => {
    if(err) {
      console.log(err);
    } else {
      console.log(`returned answer : ${JSON.stringify(content)}`);
      answer = content;
      res.send(answer); // 콜백안에 넣어줘야 제대로 결과가 리턴됨.
    }
  });


  /*if(req.session.userStatus === "false") {
    answer = {
      "message": {
        "text": `${content}를 선택하셨습니다.`
      }
    };
  }
  if (answer === "new") {
    answer = {
      "message":{
        "text":"고객님의 주소를 입력해 주십시오\n 예) OO시 OO구 OO동 삼성레미안아파트 101동 101호"
      }
    };
  }*/

  // req.session.destroy();
  // mysqlDB.end();
  // res.send(answer);
});

function checkUser(user_key, callback) {
  let message = {
    "message": {
      "text": ""
    },
    "keyboard": {}
  };
  let answer = {
    "type": "buttons",
    "buttons": ["예", "아니오"]
  };

  mysqlDB.query(`select * from users where kakao_key=\'${user_key}\'`, (err, rows, fields) => {
    console.log("in the query");
    if(!err) {
      console.log("error didn't occured while select query");
      //console.log(fields);
      if(rows[0] === undefined) {
        console.log("if rows[0] is undefined");
        mysqlDB.query(`insert into users (kakao_key) values (${mysqlDB.escape(user_key)})`, (err, rows, fields) => {
          if(!err) {
            console.log(`rows : ${JSON.stringify(rows)}`);
            //console.log(`rows[0] : ${rows[0].toString()}`);
            message = {
              "message": {
                "text": "회원정보가 입력되었습니다. \n이어서 진행하시겠습니까?"
              },
              "keyboard": answer
            };
            callback(null, message);
          } else {
            console.log(`error occured in insert query`);
            console.log(`err : ${err.toString()}`);
            /*message = {
              "message": {
                "text": err
              }
            };*/
            callback(err, null);
          }
        });
      } else {
        console.log("if rows[0] exists");
        message = {
          "message": {
            "text": "이미 존재하는 유저입니다. \n이어서 작성하시겠습니까?"
          },
          "keyboard": answer
        };
        console.log(message);
        console.log("=============== after query ===============");
        callback(null, message);
      }
    } else {
      console.log('query error : ' + err);
      message = {
        "message": {
          "text": `query error : ${err}`
        },
      };
      callback(err, null);
    }
  });
}



const askAddress = () => {
  let answer = {
    "message": {
      "text": "고객님의 주소를 입력해 주십시오\n 예) OO시 OO구 OO동 삼성레미안아파트 101동 101호"
    }
  };
  return answer;
};

app.listen(8080, () => {
  console.log('Express App on port 8080!');
});