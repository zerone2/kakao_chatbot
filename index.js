const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
// const FileStore = require('session-file-store')(session);
const mongoose = require('mongoose');
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
const User = mongoose.model('user', UserSchema);

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'zipfund@zipfund.co', // 암호화
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    url: "mongodb://localhost/zipadvisor_user",
    collection: "sessions"
  })
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
  let user_key = decodeURIComponent(req.body.user_key);
  let type = decodeURIComponent(req.body.type);
  let content = decodeURIComponent(req.body.content);
  // console.log(user_key);
  // console.log(type);
  // console.log(content);
  // console.log(req.session);

  // req.session.user_key = user_key;
  // req.session.userSelect = content;
  req.session.userStatus = "true";
  let answer = checkUser(req, user_key).then(() => console.log('no error'));

  console.log(answer);
  if(req.session.userStatus === "false") {
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
  }

  req.session.destroy();
  res.send(answer);
});

const checkUser = async (req, user_key) => {
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

  console.log('before findOne');
  await User.findOne({"key": user_key})
    .then((user) => {
      if(user) {
        message = {
          "message": {
            "text": "이미 존재하는 유저입니다.\n이어서 작성하시겠습니까?"
          },
          "keyboard": answer
        };
        console.log(message);
        return message;
      } else {
        User.create({"key": user_key}, (err) => {
          // if(err) return res.json(err);
          if (err) return false;

          console.log('Success');
          return "new";
        });
      }
    }).catch((err) => {
      return false;
    });

  /*User.findOne({"key": user_key}, (err, user) => {
    if(err) return false;

    if(user) {
      console.log('user key already exist');

      //res.send('이미 존재하는 유저입니다.\n이어서 작성하시겠습니까?');
      //req.session.userStatus = "exist";
      message = {
        "message": {
          "text": "이미 존재하는 유저입니다.\n이어서 작성하시겠습니까?"
        },
        "keyboard": answer
      };
      console.log(message);
      return message;
      //askAddress();
      /!*User
        .updateOne({"key": user_key}, {"name": "exist"})
        .then(result => {
          return `[${result}], exist 님 정보가 생성되었습니다.`;
        });*!/
    } else {
      User.create({"key": user_key}, (err) => {
        // if(err) return res.json(err);
        if(err) return false;

        console.log('Success');
        return "new";
        //res.redirect('/message');
      });
    }
    console.log('inside findONe');
  })*/
};



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