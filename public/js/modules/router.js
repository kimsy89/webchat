// var path = process.cwd()
//   , socket = require(path + '/public/js/modules/socket.js');

module.exports = function(app, callDB) {
	console.log('router app: ', callDB);

	app.get('/chat', function(req, res){
  res.render('index', req.body, function(err, html) {
    res.send(html);
  });
});

app.post('/chat/dashboard', function(req, res) {
  //console.log('req body: ', req.body);
  //로그인 후 socket 연결 하고 싶으면 dashboard callback에 io 커넥션 이벤트를 연결해야 하는가? 
  res.render('dashboard', req.body, function(err, html) {
    //socket(http);
    var emailId = req.body.email.replace('@rsupport.com', '');
    //callDB.getUser(req.body.email);
    //callDB.setUser(req.body.name, );

    callDB.getUser(emailId, function(resultCode, result) {
      console.log('>>[result]: ', resultCode);
      // DB에 없는 유저라면 결과 값이 'undefined'가 옴.
      if (resultCode == 404) {
        callDB.setUser({
          emailId: emailId,
          name: req.body.name
        }, function(result, reason) {
          console.log('>>[result] - set user result: ', result);
          console.log('>>[result] - set user reason: ', reason);
        });
      }
      res.send(html);
    });

  });
});

app.get('/chat/room/:id', function(req, res) {
  res.render('room', { id: req.params.id }, function(err, html) {
    res.send(html);
  });
});


};