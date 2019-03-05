const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysqlDB = require('./mysql-db');
const getAuth = require('./get-auth');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'zipfund@zipfund.co', // 암호화
  resave: false,
  saveUninitialized: true,
  store: new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'zipadvisor_user'
  })
}));

app.use(express.static(path.join(__dirname, 'public')));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/test', (req,res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
})

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
  console.log(req.query.id);
  req.session.userKey = req.query.id;

  let answer = {
    "type" : "buttons",
    "buttons" : ["정보입력하기", "분석결과보기"]
  };
  res.send(answer);
});

app.post('/message', (req, res) => {  // 사용자 메시지 입력
  let user_key = decodeURIComponent(req.body.user_key);
  let type = decodeURIComponent(req.body.type);
  let content = decodeURIComponent(req.body.content);
  // let answer = {};

  console.log(req.body);
  req.session.kakaoId = user_key;
  req.session.userSelect = content;
  // console.log(req.session);

  let answer = {
    "message": {
      "text": content
    },
    "keyboard": {
      "type": "buttons",
      "buttons": ["계속 진행", "나가기"]
    }
  };

  switch (content) {
    case '정보입력하기':
      console.log('정보입력하기');
     /* answer = {
        "message": {
          "text": "http://localhost:4000/finance 에서 분석을 위한 정보를 입력해주세요."
        },
        "keyboard": {
          "type": "buttons",
          "buttons": ["입력완료", "되돌아가기"]
        }
      };*/
      checkUser2(req, user_key, (err, content) => {
        if(err) {
          console.log(err);
        } else {
          console.log(`returned answer : ${JSON.stringify(content)}`);
          // answer = content.message;
          answer = {
            "message": {
              "text": "분석을 위한 정보를 입력해주세요.",
              // "photo": {
              //   "url": "./public/zipfund.jpeg",
              //   "width": 200,
              //   "height": 200
              // },
              "message_button": {
                "label": "입력하기",
                "url": "http://localhost:3000/?key=" + user_key
              }
            },
            "keyboard": {
              "type": "buttons",
              "buttons": ["되돌아가기"]
            }
          };
          res.send(answer);
        }
      });
      // res.send(answer);
      break;
    case '분석결과보기':
      checkUser(req, user_key, (err, content) => {
        if(err) {
          console.log(err);
        } else {
          console.log(`returned answer : ${JSON.stringify(content)}`);
          answer = content.message;
          if(content.nextInfo != null) req.session.nextInfo = content.nextInfo;
          // res.send(answer); // 콜백안에 넣어줘야 제대로 결과가 리턴됨.
        }
      });
      break;
    case '등록하기':
      getAuth((data) => {
        console.log(data.args);
        // res.render(data, (err, html) => {
        //   res.send(html);
        // })
      });
      break;
    case '입력완료':
      break;
    case '되돌아가기':
      console.log("되돌아가기");
      answer = {
        "type" : "buttons",
        "buttons" : ["정보입력하기", "분석결과보기"]
      };
      console.log(answer);
      // res.send(answer);
      break;
    default:
      // res.send(answer);
      break;
  }

  // res.send(answer);


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

function checkUser2(req, user_key, callback) {
  let message = {};
  let answer = {
    "type": "buttons",
    "buttons": ["등록하기", "아니오"]
  };
  mysqlDB.query(`select * from users where kakao_key=\'${user_key}\'`, (err, rows, fields) => {                       // db에서 user_key 가 이미 존재하는지 탐색
    console.log("in the query");
    if(!err) {                                                                                                        // 탐색에서 에러가 발생하지 않은 경우
      if(rows[0] === undefined) {                                                                                     // 만약 user_key 가 db안에 없다면
        console.log(`rows : ${JSON.stringify(rows)}`);
        let details = {};
        message = {
          "message": {
            "text": "등록되지 않은 회원입니다. 회원 등록을 진행하시겠습니까??"
          },
          "keyboard": answer
        };
        let content = { message, details };
        callback(null, content);                                                                                      // 콜백으로 메시지를 넘겨줌
      } else {                                                                                                        // user_key 가 이미 db에 존재하는 경우
        console.log(`rows[0] : ${JSON.stringify(rows[0])}, length : ${rows[0].firstChild}`);
        let nextInfo;
        for(let key in rows[0]){
          if(rows[0].hasOwnProperty(key) && rows[0][key] == null) {
            console.log(rows[0][key]);
            console.log(key);
            nextInfo = key;
            break;
          }
        }
        message = {
          "message": {
            "text": `이미 존재하는 유저입니다. \n${nextInfo} 부터 이어서 작성하시겠습니까?`
          },
          "keyboard": answer
        };
        let content = { message, nextInfo };
        callback(null, content);
        // return message; // 수정중
      }
    } else {                                                                                                          // 탐색에서 에러가 발생했을 경우
      console.log('query error : ' + err);
      message = {
        "message": {
          "text": `query error : ${err}`
        },
      };
      callback(err, null);
      // return message; // 수정중
    }
  });
}

/** 메시지를 받은 유저가 db 안에 존재하는지 확인하는 함수 */
function checkUser(req, user_key, callback) {
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

  mysqlDB.query(`select * from users where kakao_key=\'${user_key}\'`, (err, rows, fields) => {                       // db에서 user_key 가 이미 존재하는지 탐색
    console.log("in the query");
    if(!err) {                                                                                                        // 탐색에서 에러가 발생하지 않은 경우
      // console.log("error didn't occured while select query");
      if(rows[0] === undefined) {                                                                                     // 만약 user_key 가 db안에 없다면
        mysqlDB.query(`insert into users (kakao_key, authority) values (${mysqlDB.escape(user_key)}, ${mysqlDB.escape('user')})`, (err, rows, fields) => {  // user_key를 db안에 삽입
          if(!err) {                                                                                                  // 삽입에서 에러가 발생하지 않은 경우
            console.log(`rows : ${JSON.stringify(rows)}`);
            message = {
              "message": {
                "text": "새로운 회원정보가 입력되었습니다. \n이어서 진행하시겠습니까?"
              },
              "keyboard": answer
            };
            callback(null, message);                                                                                  // 콜백으로 메시지를 넘겨줌
          } else {                                                                                                    // 삽입에서 에러가 발생했을 경우
            console.log(`error occured in insert query`);
            console.log(`err : ${err.toString()}`);
            callback(err, null);
          }
        });
      } else {                                                                                                        // user_key 가 이미 db에 존재하는 경우
        console.log(`rows[0] : ${JSON.stringify(rows[0])}, length : ${rows[0].firstChild}`);
        let nextInfo;
        for(let key in rows[0]){
          if(rows[0].hasOwnProperty(key) && rows[0][key] == null) {
            console.log(rows[0][key]);
            console.log(key);
            nextInfo = key;
            break;
          }
        }
        message = {
          "message": {
            "text": `이미 존재하는 유저입니다. \n${nextInfo} 부터 이어서 작성하시겠습니까?`
          },
          "keyboard": answer
        };
        let content = { message, nextInfo };
        callback(null, content);
        // return message; // 수정중
      }
    } else {                                                                                                          // 탐색에서 에러가 발생했을 경우
      console.log('query error : ' + err);
      message = {
        "message": {
          "text": `query error : ${err}`
        },
      };
      callback(err, null);
      // return message; // 수정중
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