/*
 web chatting
 Author Rsupport R&D Center | Web-dev2 Team | Kim So Young 2015/03
 Copyright © RSUPPORT Co., Ltd. ALL RIGHTS RESERVED.
 */

;(function($, win, doc, chat) {
  chat.nameSpace = function(str) {
    var parts = str.split(".")
      , parent = chat
      , i
      , iTotal;
    
    if (parts[0] === "chat") {
      parts = parts.slice(1);
    }
    iTotal = parts.length;
    for (i = 0; i < iTotal; ++i) {
      if (typeof parent[parts[i]] === "undefined") {
        parent[parts[i]] = {};
      }
      parent = parent[parts[i]];
    }
    return parent;
  };

  chat.nameSpace('chat.view.dashboard');
  chat.nameSpace('chat.view.room');


  chat.router = function(loc) {
    var socket = io('http://172.25.120.191:3000/chat');

    if (loc.match('dashboard')) {
      console.log('dashboard: ', chat.view.dashboard);
      chat.view.dashboard(socket);
      //alert('location.href: ' + location.href.match('dashboard'));
    } else if (loc.match('room')) {
      chat.view.room(socket);
      //alert('location.href: ' + location.href.match('room'));
    }
  }

  chat.init = function() {
    chat.router(location.href);
  };

  chat.init();

})(jQuery, this, document, window.chat = window.chat || {});



/*
 web chatting
 Author Rsupport R&D Center | Web-dev2 Team | Kim So Young 2015/03
 Copyright © RSUPPORT Co., Ltd. ALL RIGHTS RESERVED.
 */

;(function($, win, doc, chat) {
  chat.view.dashboard = function(socket) {
    console.log('=====chat.view.dashboard=====', this);

    var roomList
      , userName;

    // functions related with script
    var generateUUID = function() {
          var d = new Date().getTime()
            , uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = (d + Math.random()*16)%16 | 0;
              d = Math.floor(d/16);
              return (c=='x' ? r : (r&0x3|0x8)).toString(16);
          });
          return uuid;
        };

    // functions related with UI
    var drawRoomList = function(data) {
          var emptyList = []
            , roomList = ($.isArray(data)) ? data : []
            , $roomUl = $('#room-list');

            /*if (!$.isArray(data)) {
              emptyList.push(data);
              roomList = emptyList;
            }*/

          console.log('draw room list: ', roomList);
          $roomUl.empty();
          for (var i in roomList) {
            $([
              '<li>',
                '<a href="chat/room/" >' + roomList[i] + '</a>',
              '</li>'
            ].join('\n')).appendTo($roomUl);
          }
        }
      , drawUserList = function(data) {
          var userArray = data;
          
          $('#online-users').empty();

          for (var i in userArray) {
            $([
              '<li data-uniqId="' + userArray[i].userUniqId + '">',
                '<a href="/chat/room/">' + userArray[i].userName + '</a>',
              '</li>'
            ].join('\n')).appendTo($('#online-users'));
          }
        }
      , enterTheRoom = function(data) {
          var roomId = data.roomId;

          $.ajax({
            url: '/chat/room/' + roomId,
            type: 'get',
            dataType: 'html',
            beforeSend: function() {
              //alert('ajax before Send');
            },
            success: function(data) {
              //alert('success');
              console.log('roomId: ', roomId);
              $('.ajax-area').html(data);
              chat.view.room(socket, roomId);
            }
          })
        }
      , init = function() {
          // user id를 세션스토리지에 저장.
          sessionStorage.setItem('userName', $('body').attr('data-user-name'));
          chat.myName = sessionStorage.getItem('userName');

          if (!chat.myName) {
            location.href = '/chat/';
            alert('로그인을 해주세요.');
          }

          $('#room-name').focus();

          socket.on('connected', function(data) {
            console.log('user info: ', data);
            var userUniqId = data;
            chat.myUniqId = userUniqId;

            socket.emit('setUserInfo', {
              userName: userName,
              userUniqId: userUniqId
            });
          });
        };

    init();

    // 방 정보 가져오기.
    socket.on('getUserInfo', function(data) {
      // data = ['user1', 'user2', 'user3'];
      drawUserList(data);
    })
    .on('invitedToRoom', function(data) {
      enterTheRoom(data);
    })
    .on('openRoom', function(data) {
      enterTheRoom(data);
    });

    // script event
    $('#online-users').on('dblclick', 'a', function(event) {
      event.preventDefault();

      socket.emit('createRoom', {
        hostId: userName,
        clientId: $(this).parent('li').attr('data-uniqId'),
        roomId: generateUUID()
      });
    })
    .on('click', 'a', function(event) {
      event.preventDefault();

      $(this).parents('li').toggleClass('active');
    });
  };

  chat.view.room = function(socket, roomId) {
    console.log('=====chat.view.room=====');

    var userName = chat.myName
      , userUniqId = chat.myUniqId;
    console.log('chat.myName: ', userName);
    console.log('chat.myUniqId: ', userUniqId);

    // 대화방 입장
    socket.emit('requestChat', {
      userName: userName,
      userUniqId: userUniqId,
      roomId: roomId
    });

    socket.on('startChat', function(data) {
      $('#message-list').append('<li class="noti">Welcome '+ data + '!</li>');
    })
    .on('subscribe', function(data){
      // 메세지 받았을 때
      console.log('받은 메세지: ', data);
      var $name = $('<span class="user-name">').text(data.userName)
        , $message = $('<span class="user-message">').text(data.message)
        , $fullMessage = $('<li>').append($name).append($message);

      $('#message-list').append($fullMessage);
    });

    // 메세지 전송 시
    $('#send').on('click', function(event){
      event.preventDefault();

      socket.emit('publish', {
        roomId: roomId,
        userName: userName,
        message: $('.input-message').val()
      });
      console.log('보낸 메세지:', $('#message').val());

      $('#message').val('');
      $('#send').removeClass('active');
    });

    // 메세지 입력 시
    $('#message').on('keyup', function(event) {
      var keyCode = event.keyCode
        , msgLength = $(this).val().length;

      if (keyCode == 13) {
        $('#send').trigger('click');
      }

      $('#send')[(msgLength > 0) ? 'addClass' : 'removeClass']('active');
    });
  };

})(jQuery, this, document, window.chat = window.chat || {});


