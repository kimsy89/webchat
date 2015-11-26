// various related with server.
var express = require('express')
  , app = express()
  , http = require('http').Server(app)
  , io = require('socket.io')(http)
  , ejs = require('ejs')
  , bodyParser = require('body-parser');

// export js module
var router = require('./public/js/modules/router.js')
  , db = require('./public/js/modules/db.js')
  , callDB = db();

// binding server -----------------------------------------------
app.use(express.static(__dirname + '/'));
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(bodyParser.json()); // form submit된 값을 json으로 사용하고 싶어서 추가
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
//app.use(multer()); // for parsing multipart/form-data


router(app, callDB);

http.listen(3000, 'localhost', function(){
  console.log('==================== listen on 172.25.120.191:3000 ====================');
});

// function -----------------------------------------------------------
function saveRoomInfo(users, roomId, resultCode) {
  switch (resultCode) {
    case '200':
      //console.log('>>[join // result] 200');
      callDB.setRoom(users, roomId, function(resultCode) {
        //console.log('>>[join // db set room result]: ', resultCode);
      });
      break;
    case '404': 
      console.log('여기서 에러날일이 없겠지만 혹시 모르니까.');
      break;
  };
}
// function -----------------------------------------------------------
function extractIndex(repeatTarget, condition, compareTarget) {
  for (var i = 0, j = repeatTarget.length; i < j; i++) {
    // 유저 리스트에 내가 있다면.
    if (repeatTarget[i][condition] == compareTarget[condition]) {
      //console.log('[extractIndex]: condition: ', condition);
      return i;
    }
  }
}

// socket -----------------------------------------------------------
var _socketRoom = {}
  , _userList = [];

var user = io.of('/chat');

user.on('connect', function(socket) {
  console.log('>>[connect]: ', socket.id);

  /********** socket event emit **********/
  // 채팅 로비에 진입.
  socket.emit('login', socket.id);
  
  
  /********** socket event on **********/

  /* ********************************************
   *  saveUserInfo
   *  @desc 로그인한 유저 리스트에 표시
   * ********************************************/
  socket.on('saveUserInfo', function(userInfo) {
    // 채팅 로비에 진입한 유저의 정보 갱신
    // userInfo = { emailId: XX, name: XX, socketId: XX };
    //console.log('>>>>[save user Info]');
    // 대화 가능 유저 리스트에 한 사람이라도 있을 때.
    if (_userList.length) {
      userIndex = extractIndex(_userList, 'emailId', userInfo);
      //console.log('user Index: ', userIndex);

      if (userIndex >= 0) {
        _userList[userIndex] = userInfo;
      } else {
        _userList.push(userInfo);
      }

    } else {
      // 대화 가능 유저 리스트가 한 명도 없을 때
      _userList.push(userInfo);
    }
    notice(_userList);
    
  })
  /* ********************************************
   *  create
   *  @desc 룸 생성(유저 클릭 시)
   * ********************************************/
  .on('create', function(roomInfo) {
    console.log('>>[create] - roomInfo: ', roomInfo);
    // roomInfo = {
    //   roomId: createUUID(),
    //   host: _host,
    //   guests: [{
    //     emailId: $selectedUser.attr('data-uniqId'),
    //     name: $(this).text(),
    //     socketId: $selectedUser.attr('data-socketId')
    //   }].unshift(_host)
    // };

    var roomId = roomInfo.roomId
    	, host = roomInfo.host
      , guests = roomInfo.guests;

    //roomId가 있으면 그 방 나왔다는 이벤트 쏘고, roomId 값 지우기 (지우는 메서드 따로 생성하기)
    _socketRoom[roomId] = {};
    _socketRoom[roomId]['roomId'] = roomId;
    _socketRoom[roomId]['host'] = host;
    _socketRoom[roomId]['guests'] = [];
    _socketRoom[roomId]['guests'].push(host);
    console.log('====================>> SOCKET ROOM INFO: ', _socketRoom[roomId]);

    // 대화 신청한 상대 유저에게 requestJoin이벤트 할당.
    for (var i in guests) {
      socket.to(guests[i].socketId).emit('requestJoin', roomId);  
    }

    // 나는 대화방에 조인
    socket.join(_socketRoom[roomId]['roomId']);
    callDB.getUser(host.emailId, function(resultCode, users) {
      saveRoomInfo(users[0], roomId, resultCode);
      socket.emit('enter', _socketRoom[roomId]['roomId']);
    });
  })
  /* ********************************************
   *  invite
   *  @desc 초대하기
   * ********************************************/
   /*
		초대하기를 따로 뺀 이유는, 클라이언트에서 사람을 드래그할 때 초대가 시작되는데,
		requestJoin으로 합치려고 했지만, 클라이언트에서는 socket.to 메서드를 지원 안해.d
   */
  .on('invite', function(roomInfo) {
    //console.log('>>[invite] - roomInfo : ', roomInfo);
    // roomInfo = { roomId: XX, hostInfo: { emailId, name, socketId } }
    var roomId = roomInfo.roomId
      , inviteeInfo = roomInfo.invitee
      , inviteeInUserList = _userList.filter(function(user) {
      		return user.emailId == inviteeInfo.emailId;
	      });

    inviteeInUserList.room = inviteeInUserList.room || [];
    inviteeInUserList.room.push(roomId);

    socket.to(inviteeInfo.socketId).emit('requestJoin', roomId);
  })
  /* ********************************************
   *  respondJoin
   *  @desc invite > requestJoin에 응답할 때.
   * ********************************************/
  .on('respondJoin', function(joinInfo) {
    // joinInfo = { roomId, respondent: { emailId, name, socketId } }
    var roomId = joinInfo.roomId
      , respondent = joinInfo.respondent
      , room = _socketRoom[roomId];

    socket.join(room['roomId']);
    room['guests'].push(respondent);

    // enter 시에 DB와 연결하여 각 유저의 room 값에 저장.
    callDB.getUser(respondent.emailId, function(resultCode, users) {
      saveRoomInfo(users[0], roomId, resultCode);
    });

    socket.emit('enter', roomId);
  })
  /* ********************************************
   *  entered
   *  @desc 룸에 들어가자마자.
   *  @role 클라이언트에서 룸에 들어갔다고 정보를 보내오면,
   *        해당 룸에 있는 사람들 목록을 보내준다.
   * ********************************************/
  .on('entered', function(enterInfo) {
    // enterInfo = { roomId, enterer: { emailId, name, socketId } }
    var roomId = enterInfo.roomId
      , enterer = enterInfo.enterer
      , guests = _socketRoom[roomId]['guests']
      , names = []
      , others;
    
    if (guests.length > 2) {
      // 그룹 채팅일 때, 멤버들의 이름을 추출하여 보내주기.
      for (var i = 0, j = guests.length; i < j; i++) {
        names.push(guests[i].name);
      } 
      user.in(_socketRoom[roomId]['roomId']).emit('updateMembers', names.join(', '));
    } else {
      // 1:1 채팅일 때, 상대방의 이름을 나의 룸에 띄우기.
      others = guests.filter(function(guest) {
        if (guest.emailId != enterer.emailId) {
          return true;
        } else {
          return false;
        }
      });
      //console.log('me: ', socket.id);
      //console.log('others', others);
      socket.emit('updateMembers', others[0].name); 
    }
  })
  /* ********************************************
   *  leave
   *  @desc 방탈.
   * ********************************************/
  .on('leave', function(data) {
    // data = { id: XX, host: XX }
    socket.leave(_socketRoom[data.id]['roomId']);
    // leave로 방을 나갔는데 다시 똑같은 상대방과 대화를 시작하면 대화가 두개씩 나온다. 버그 수정해야 함.
    user.in(_socketRoom[data.id]['roomId']).emit('notice', {
      info: 'leave',
      target: data.host
    });
    socket.emit('leaveResult', {
      result: 'success',
      id: data.id
    });
  })
  /* ********************************************
   *  send
   *  @desc 메시지 전송
   * ********************************************/
  .on('send', function(data) { 
    console.log('server on send');
    /* 메세지 발신 */
    user.in(_socketRoom[data.roomId]['roomId']).emit('receive', data);
  })
  /* ********************************************
   *  disconnect
   *  @desc 소켓 통신 끊김
   * ********************************************/
  .on('disconnect', function(data) {
    /* socket 끊겼을때 */
    console.log('>>[disconnected]: ', socket.id + ' // ' + data);
    // 해당 socket.id를 갖고 있는 배열 아이템을 userList 에서 삭제하기.
    for (var i in _userList) {
      if (_userList[i].userUniqId == socket.id) {
        _userList.splice(i, 1);
      }
    }
  })
  /* ********************************************
   *  reconnect
   *  @desc 소켓 재연결
   * ********************************************/
  .on('reconnect', function(data) {
    /* socket reconnect */
    console.log('>>[reconnect]: ', socket.id + ' // ' + data);
  });

  // socket 연결되어 있는 모든 유저에게.
  function notice(userList) {
    user.emit('updateUserList', userList);
    console.log('>>[notice]: ', userList);
  }

});
