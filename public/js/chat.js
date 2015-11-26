/*
 web chatting
 Kim So Young 2015/03
 */

;(function($, win, doc, chat) {
  chat.nameSpace('chat.view.dashboard');
  chat.nameSpace('chat.view.room');

  chat.view.dashboard = function(socket) {
    console.log('=====chat.view.dashboard=====', this);

    var _view = this
      , _host = chat.user.host
      , _users = chat.user.users
      , _socket = socket;

    // functions related with script
    var createUUID = function() {
          var d = new Date().getTime()
            , uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = (d + Math.random()*16)%16 | 0;
              d = Math.floor(d/16);
              return (c=='x' ? r : (r&0x3|0x8)).toString(16);
          });
          return uuid;
        };

    var _draw = {
          userList: function(userList, callback) {
            $('#online-users').empty();

            for (var i in userList) {
              $([
                '<li data-emailId="' + userList[i].emailId + '" data-socketId="' + userList[i].socketId + '">',
                  '<a href="/chat/room/" class="clear">',
                    '<span class="icon face"><i class="fa fa-user"></i></span>',
                    '<span class="name">' + userList[i].name + '</span>',
                  '</a>',
                '</li>'
              ].join('\n')).appendTo($('#online-users'));
            }

            callback();
          },
          room: function(roomId) {
            // data = { hostId: XX, guestId: XX, roomId: XX };
            $.ajax({
              url: '/chat/room/' + roomId,
              type: 'get',
              dataType: 'html',
              beforeSend: function() {
                //alert('ajax before Send');
              },
              success: function(data) {
                //alert('success');
                $('.ajax-area').html(data);
                _view.room(_socket, roomId);
              }
            });
          }
        };

    var init = function() {
          _host.emailId = sessionStorage.getItem('emailId');
          _host.name = sessionStorage.getItem('name');
          console.log('>>[chat.dashboard.init]: _host.name? ', _host.name);

          _socket.on('login', function(socketId) {
            console.log('>>[login] user: ', socketId);
            _host.socketId = socketId;

            _socket.emit('saveUserInfo', {
              emailId: _host.emailId,
              name: _host.name,
              socketId: _host.socketId
            });
          });
        };

    init();

    // 접속한 유저리스트 가져오기.
    _socket.on('updateUserList', function(userList) {
      // data = [ { emailId: XX, name: XX, socketId: XX }, ... ];
      console.log('>>[updateUserList] userList: ', userList);
      
      _draw.userList(userList, function() {
        $('#online-users li').draggable({
          revert: true
        });
      });
    })
    .on('requestJoin', function(roomId) {
      console.log('>>[requestJoin] - roomId: ', roomId);
      _socket.emit('respondJoin', {
        roomId: roomId,
        respondent: {
          emailId: _host.emailId,
          name: _host.name,
          socketId: _host.socketId
        }
      });
    })
    .on('enter', function(roomId) {
      console.log('[enterRoom]: ', roomId);
      _draw.room(roomId);
      //chat.room.push(roomId);
    });

    // 채팅할 대상 더블클릭
    $('#online-users').on('dblclick', 'a', function(event) {
      event.preventDefault();
      var $selectedUser = $(this).parent('li');

      // 자신을 선택했을때
      if (_host.emailId == $selectedUser.attr('data-emailId')) {
        alert('나랑 대화할거야?');
        return false;
      }

      var newRoom = {
        roomId: createUUID(),
        host: _host,
        guests: [{
          emailId: $selectedUser.attr('data-emailId'),
          name: $.trim($(this).text()),
          socketId: $selectedUser.attr('data-socketId')
        }]
      };

      console.log('new room: ', newRoom);

      _socket.emit('create', newRoom);
    })
    // 채팅할 대상 클릭 (다중클릭 구현 예정)
    .on('click', 'a', function(event) {
      event.preventDefault();

      $(this).parents('li').toggleClass('selected');
    });
  };


  chat.view.room = function(socket, roomId) {
    console.log('=====chat.view.room=====', roomId);

    var _view = this
      , _host = chat.user.host
      , _roomId = roomId
      //, _others = $.trim(roomInfo.others)
      , _socket = socket
      , _messageListHeight = 0;

    // _host에 room 정보 넣고, 활성화되어있는지 여부도 넣기.
    // room정보를 넣을 때 있는지 없는지부터 먼저 파악.
    // 아니면 어차피 룸 정보 db에 있으니까 활성화 된 roomid만 앞단에 저장해놓을까?

    var drawBalloon = function(messageInfo) {
          var name = messageInfo.userName
            , message = messageInfo.message
            , className = (messageInfo.roomId) ? 'others' : 'me';

          // if (!message.length) {
          //   return false;
          // }

          var $message = $([
                '<li class="' + className + '">',
                  '<p class="user-name">' + name + '</p>',
                  '<p class="user-message">' + message + '</p>',
                  '<p class="time">' + chat.getTime() + '</p>',
                '</li>'
              ].join('\n'));

          // var $name = $('<span class="user-name">').text(name)
          //   , $message = $('<span class="user-message">').text(message)
          //   , $fullMessage = $('<li class="'+ className +'">').append($name).append($message);

          var $chatMainHeight = $('.chat-main').outerHeight()
            , $messageList = $('#message-list');

          $message.appendTo('#message-list').fadeIn(200);
          _messageListHeight = _messageListHeight + $message.outerHeight();
          ($chatMainHeight < _messageListHeight) && $messageList.scrollTop(_messageListHeight);
        }
      , _init = function() {
          _socket.emit('entered', {
            roomId: _roomId,
            enterer: {
              emailId: _host.emailId,
              name: _host.name,
              socketId: _host.socketId
            }
          });

          $('#room').droppable({
            drop: function(event, ui) {
              var newGuestInfo = $(ui.draggable).data();

              if ($(ui.draggable).parent('#online-users').length) {
                var inviteeInfo = {
                  roomId: _roomId,
                  invitee: {
                    'emailId': newGuestInfo.emailid,
                    'socketId': newGuestInfo.socketid
                  }
                };
                _socket.emit('invite', inviteeInfo);  
              }

              
            }
          });
        };

    _init();

    // socket event
    _socket.on('updateMembers', function(members) {
      $('#with').text(members);
    })
    .on('notice', function(data) {
      if (data.info == 'leave') {
        $('#message-list').append('<li class="noti">'+ data.target +'님이 나감</li>');  
      }
    })
    .on('receive', function(data){
      // 메세지 받았을 때
      console.log('[receive]: ', data);
      if (data.userName != _host.name) {
        drawBalloon(data);
        !chat.isActive && chat.noti(data.userName, {
          body: data.message
        });
      }
    })
    .on('leaveResult', function(data) {
      if (data.result == 'success') {
        //$('#chat-wrapper').remove();
        for (var i in chat.room) {
          chat.room[i] == data.id && chat.room.splice(i, 1);
        }
        console.log('[leaveResult]: ', chat.room);
      } else {
        console.log('>>[ERROR]: 예상치 못한 오류');
      }
    });

    // 메세지 전송 시
    $('#send').on('click', function(event){
      event.preventDefault();
      var $message = $('#message').val();

      if (!$message.length) {
        return false;
      }

      _socket.emit('send', {
        roomId: _roomId,
        userName: _host.name,
        message: $message
      });
      //console.log('[send]:', $message.length);

      drawBalloon({
        userName: _host.name,
        message: $message
      });

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

    // 나가기 클릭 시
    $('.chat-header').on('click', '#leave', function(event) {
      event.preventDefault();
      _socket.emit('leave', {
        id: chat.room[0],
        host: _host.name
      });
    });
  };


  chat.router = function(loc) {
    //var socket = io('http://172.25.110.201:3000/chat');
    var socket = io('http://localhost:3000/chat');

    if (loc.match('dashboard')) {
      // user name을 세션스토리지에 저장.
      sessionStorage.clear();
      sessionStorage.setItem('emailId', $('body').attr('data-email-id').replace('@rsupport.com', ''));
      sessionStorage.setItem('name', $('body').attr('data-name'));
      
      chat.view.dashboard(socket);
      //alert('location.href: ' + location.href.match('dashboard'));
    } else if (loc.match('room')) {
      //chat.view.room(socket);
      //alert('location.href: ' + location.href.match('room'));
    }
  }

  chat.init = function() {
    // 새로고침 했을 때 유저 정보가 남아있어야 한다.
    this.user = {
      host: {},
      users: []
    };
    this.room = [];
    chat.router(location.href);
  };

  $(window).on('load', function() {
    console.log('=======init======');
    chat.init();

    Notification.requestPermission(function (status) {
      if (Notification.permission !== status) {
        console.log('what is the status: ', status);
        Notification.permission = status;
      }
    });
  })
  .on('focus', function() {
    chat.isActive = true;
  })
  .on('blur', function() {
    chat.isActive = false;
  });

  

})(jQuery, this, document, window.chat = window.chat || {});


