module.exports = function(http) {
  var io = require('socket.io')(http);

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
  var socketRoom = {}
    , userList = [];

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
      if (userList.length) {
        userIndex = extractIndex(userList, 'emailId', userInfo);
        //console.log('user Index: ', userIndex);

        if (userIndex >= 0) {
          userList[userIndex] = userInfo;
        } else {
          userList.push(userInfo);
        }

      } else {
        // 대화 가능 유저 리스트가 한 명도 없을 때
        userList.push(userInfo);
      }
      notice(userList);
      
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
      //   }]
      // };

      var _roomId = roomInfo.roomId
        , _guests = roomInfo.guests
        , _allGuests;
      
      //선택한 대상과의 채팅방 개설
      //userList중 hostId와 같은 것을 찾기.
      //같은 것이 있으면 roomId가 있는지 찾기.
      //roomId가 있으면 그 방 나왔다는 이벤트 쏘고, roomId 값 지우기 (지우는 메서드 따로 생성하기)
      socketRoom[_roomId] = {};
      socketRoom[_roomId]['roomId'] = _roomId;
      socketRoom[_roomId]['host'] = roomInfo.host;
      socketRoom[_roomId]['guests'] = _guests;

      // 대화 신청한 상대 유저에게 requestJoin이벤트 할당.
      for (var i in _guests) {
        socket.to(_guests[i].socketId).emit('requestJoin', _roomId);  
      }

      // 별도 변수에 아래의 문장을 할당하면 리턴되는건 새 배열이 아니고, 배열 length.
      //_guests.push(roomInfo.host);

      // 방 멤버들의 id와 userlist에 있는 유저 중 id가 같으면 roomID 값 넣어주기
      for (var i in userList) {
        userList[i].room = [];

        for (var j in _allGuests) {
          if (userList[i].emailId == _allGuests[j].emailId) {
            userList[i].room.push(_roomId);
          }
        }
      }

      // 나는 대화방에 조인
      socket.join(socketRoom[_roomId]['roomId']);
      callDB.getUser(roomInfo.host.emailId, function(resultCode, users) {
        saveRoomInfo(users[0], _roomId, resultCode);
        var nameOfGuests;

        if (_allGuests.length > 2) {
          for (var i = 0, j = _guests.length; i < j; i++) {
            nameOfGuests = [];
            nameOfGuests.push(_guests[i].name);
          }
          nameOfGuests.join(', ');
        } else {
          nameOfGuests = _guests[0].name;
        }

        socket.emit('enter', {
          others: nameOfGuests,
          roomId: socketRoom[_roomId]['roomId']
        });
      });
    })
    /* ********************************************
     *  invite
     *  @desc 초대하기
     * ********************************************/
    .on('invite', function(roomInfo) {
      console.log('>>[invite] - roomInfo : ', roomInfo);
      // roomInfo = { roomId: XX, hostInfo: { emailId, name, socketId } }
      var _roomId = roomInfo.roomId
        , _guestInfo = roomInfo.guest;

      //console.log('>>[invite] - roomInfo : ', roomInfo);
      //console.log('>>[invite] - userlist: ', userList);
      userList.room = [];
      for (var i = 0, j = userList.length; i < j; i++) {
        if (userList[i].emailId == _guestInfo.emailId) {
          userList[i].room = [];
          userList[i].room.push(_roomId);
        }
      }

      socket.to(_guestInfo.socketId).emit('requestJoin', _roomId);

    })
    /* ********************************************
     *  responseJoin
     *  @desc 
     *  - create > requestJoin 혹은,
     *  - invite > requestJoin 에 응답할 때.
     * ********************************************/
    .on('responseJoin', function(joinInfo) {
      //console.log('>>[responseJoin]: ', joinInfo);
      var _roomId = joinInfo.roomId
        , _emailId = joinInfo.emailId
        , guests = socketRoom[_roomId]['guests']
        , all = socketRoom[_roomId]['all']
        , nameOfGuests = [];

      console.log('>>[responseJoin] guests : ', guests);
      console.log('>>[responseJoin] all : ', all);

      socket.join(socketRoom[_roomId]['roomId']);
      guests.push(joinInfo);
      all.push(joinInfo);
      // enter 시에 DB와 연결하여 각 유저의 room 값에 저장.
      callDB.getUser(_emailId, function(resultCode, users) {
        //console.log('>>[join] - joinInfo: ', joinInfo);
        //console.log('>>[join] - users: ', users);
        saveRoomInfo(users[0], _roomId, resultCode);
      });

      for (var i = 0, j = all.length; i < j; i++) {
        nameOfGuests.push(all[i].name);
      }

      console.log('>>[responseJoin]: ', nameOfGuests);
      socket.emit('enter', {
        others: nameOfGuests,
        roomId: _roomId
      });
    })
    /* ********************************************
     *  leave
     *  @desc 방탈.
     * ********************************************/
    .on('leave', function(data) {
      // data = { id: XX, host: XX }
      socket.leave(socketRoom[data.id]['roomId']);
      // leave로 방을 나갔는데 다시 똑같은 상대방과 대화를 시작하면 대화가 두개씩 나온다. 버그 수정해야 함.
      user.in(socketRoom[data.id]['roomId']).emit('notice', {
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
      user.in(socketRoom[data.roomId]['roomId']).emit('receive', data);
    })
    /* ********************************************
     *  disconnect
     *  @desc 소켓 통신 끊김
     * ********************************************/
    .on('disconnect', function(data) {
      /* socket 끊겼을때 */
      console.log('>>[disconnected]: ', socket.id + ' // ' + data);
      // 해당 socket.id를 갖고 있는 배열 아이템을 userList 에서 삭제하기.
      for (var i in userList) {
        if (userList[i].userUniqId == socket.id) {
          userList.splice(i, 1);
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

  //return
};

