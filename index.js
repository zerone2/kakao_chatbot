const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

/*app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});*/
app.get('/keyboard', (req, res) => {
  let answer = {
    "type" : "buttons",
    "buttons" : ["시뮬레이터"]
  };
  res.send(answer);
});

app.post('/message', (req, res) => {
  console.log(req.body);
  let user_key = decodeURIComponent(req.body.user_key);
  let type = decodeURIComponent(req.body.type);
  let content = decodeURIComponent(req.body.content);
  console.log(user_key);
  console.log(type);
  console.log(content);

  let answer = {
    "message":{
      "text":content + "를 선택하셨습니다."
    }
  };
  res.send(answer);
});



app.listen(8080, () => {
  console.log('Express App on port 8080!');
});