const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'zipfund@zipfund.co', // 암호화
  resave: false,
  saveUninitialized: true,
  store: new FileStore()
}));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/keyboard', (req, res) => {  // 최초
  let answer = {
    "type" : "buttons",
    "buttons" : ["시뮬레이터", "투자분석하기"]
  };
  res.send(answer);
});

app.post('/message', (req, res) => {  // 사용자 메시지 입력
  //console.log(req.body);
  let user_key = decodeURIComponent(req.body.user_key);
  let type = decodeURIComponent(req.body.type);
  let content = decodeURIComponent(req.body.content);
  // console.log(user_key);
  // console.log(type);
  // console.log(content);
  console.log(req.session);

  req.session.user_key = user_key;
  req.session.userSelect = content;
  if(!req.session.count) req.session.count = 1;
  else req.session.count += 1;

  let answer = {
    "message":{
      "text":content + "를 선택하셨습니다."
    }
  };
  if (req.session.userSelect === "시뮬레이터") {
    answer = {
      "message":{
        "text":"고객님의 주소를 입력해 주십시오"
      }
    };
  }

  req.session.destroy();
  res.send(answer);
});



app.listen(8080, () => {
  console.log('Express App on port 8080!');
});