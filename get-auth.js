const axios = require('axios');

var getAuth = (callback) => {
  axios.get('https://kauth.kakao.com/oauth/authorize',{
    params: {
      client_id: '7b89f37361730f45f77fe76232142d31',
      redirect_uri: 'http://localhost:3000/oauth',
      response_type: 'code'
    }
  }).then((res) => {
    // console.log(res.data);
    callback(res);
    // return res.data;
  }).catch((err) => {
    console.log(err);
  })
};

/*const https = require('https');

var options = {
  host: "kauth.kakao.com",
  path: "/oauth/authorize?client_id=7b89f37361730f45f77fe76232142d31&redirect_uri=https://55b876bf.ngrok.io/finance&response_type=code",
  method: "get"
};

var req = https.request(options, (res) => {
  var responseString = "";

  res.on("data", function(data) {
    responseString += data;
  });
  res.on("end", function () {
    console.log(responseString);
  })
});*/

module.exports = getAuth;