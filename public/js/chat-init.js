/*
 web chatting init
 Kim So Young 2015/03
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

  chat.noti = function(title, opts) {
    if (Notification && Notification.permission === 'granted') {
      var noti = new Notification(title, opts);
      noti.onshow = function() {
        setTimeout(noti.close.bind(noti), 5000);
      }  
    } else {

    }
  };

  chat.getTime = function() {
    var today = new Date()
      , now;

    return today.getHours() + ':' + today.getMinutes();
  };


})(jQuery, this, document, window.chat = window.chat || {});


