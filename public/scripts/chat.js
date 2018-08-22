function Chat() {
    this.url = "http://localhost:8080";
    this.currentUser = {};
    this.selectedUser = {};
    this.selectedChat = '';
    this.searchMode = false;

    this.token = window.localStorage.getItem('token');
    this.debounceTimeout = null;

    if (this.token) {
        $.ajaxSetup({
            headers: {
                'Authorization': window.localStorage.getItem('token')
            }
        })
    }

    //Event Listeners
    $('#searchForUser').on('change keyup', this.searchUser.bind(this));
    $('#searchForUser').focus(this.startSearch.bind(this));
    $('#sidebarTitle').click(this.goBack.bind(this));
    $('#sendBtn').click(this.sendMessage.bind(this));
    $('#messageText').on('keyup', this.enterPressed.bind(this));
}

Chat.prototype.enterPressed = function(e){
    if(e.keyCode === 13){
        this.sendMessage();
        $('#messageText').val('');
    }
}

Chat.prototype.loadUserProfile = function(){
    var self = this;

    $.get(this.url + '/api/users/current')
    .then(function(data){
        self.currentUser = data;
        self.initSocket(self.currentUser);
    })
    .catch(function(error){
        console.log(error);
    });
}

Chat.prototype.appendNewChat = function(chatId, uid, fname, lname, lastSent, recent){
    $('.inbox_chat').append(
        '<div data-chatid="' + chatId + '" data-id="' + uid + '" class="chat_list">' +
            '<div class="chat_people">' +
                    '<div class="chat_img">' + 
                    '<img src="https://ptetutorials.com/images/user-profile.png" alt="sunil">' + 
                    '</div>' +
                    '<div class="chat_ib">' +
                        '<h5>' + fname + ' ' +  lname + '<span class="chat_date">' + formatDate(lastSent) + '</span></h5>' +
                        '<p>' + recent + '</p>' +
                    '</div>' +
                '</div>' +
        '</div>'
    )
}

//Appends Incoming Message
Chat.prototype.appendIncomingMessage = function(message, time){
    $('.msg_history').append(
        '<div class="incoming_msg">' +
            '<div class="incoming_msg_img">' + 
                '<img src="https://ptetutorials.com/images/user-profile.png" alt="sunil">' + 
            '</div>' +
            '<div class="received_msg">' +
                '<div class="received_withd_msg">' +
                    '<p>' + message + '</p>' +
                    '<span class="time_date">' + time + '</span>' +
                '</div>' +
            '</div>' +
      '</div>'
    );
}

Chat.prototype.appendOutgoingMessage = function(message, time){
    $('.msg_history').append(
        '<div class="outgoing_msg">' +
            '<div class="sent_msg">' +
                '<p>' + message + '</p>' +
                '<span class="time_date">' + time + '</span>' +
            '</div>' +
        '</div>'
    );
}

Chat.prototype.renderChats = function (currentUser) {
    var self = this;

    function getOtherUserInfo(participants){
        return participants.find(user => self.currentUser._id != user._id);
    }

    //Getting all chats containing participants, recent message, id's
    $.get(this.url + '/api/chat/chats')
    .then(function(chats){
        $.each(chats, function (index, chat) {
            let newChat = {
                _id: getOtherUserInfo(chat.participants)['_id'],
                firstName: getOtherUserInfo(chat.participants)['firstName'],
                lastName: getOtherUserInfo(chat.participants)['lastName'],
                username: getOtherUserInfo(chat.participants)['username']
            }

            //Append new chat window
            self.appendNewChat(chat._id, newChat._id, newChat.firstName, newChat.lastName, chat.lastSent, chat.recentMessage);
    
            //Event listener for each chat window
            $('[data-id="' + newChat._id + '"]').on('click', function(){
                self.selectedChat = chat._id; //Sets selected chat
                self.openChat(newChat._id); //Open chat requests all messages
            });
        });
    })
    .catch(function(err){
        console.log(err);
    })
}
    
Chat.prototype.openChat = function(id){
    var self = this;
    this.selectedUser = id;

    $('.msg_history').html('');

    $.get(this.url + '/api/chat/chats/' + id)
    .then(function(chat){
        $.each(chat.messages, function(index, message){
            if(self.currentUser._id != message.meta.user){
                self.appendIncomingMessage(message.message, '7:50 PM');
            } else {
                self.appendOutgoingMessage(message.message, '7:50 PM');
            }
        })
        
        $('.msg_history').scrollTop($('.msg_history')[0].scrollHeight);
    })
    .catch(function(error){
        console.log(error);
    });
}

Chat.prototype.sendMessage = function(){
    var self = this;
    var newMessage = {
        message: $('#messageText').val()
    }

    //If we are in search mode and we send a message, go back
    //Then create new chat window with new user's info
    //Then open the chat
    if(this.searchMode){
        this.goBack();
    }

    $.post(this.url + '/api/chat/send/' + this.selectedUser, newMessage)
    .then(function(message){
        //If we are creating a new chat, append new chat window
        if(message.newChat && message.newMessage){
            //Append New Chat
            self.appendNewChat(message.newChat._id, message.receiver._id, message.receiver.firstName, message.receiver.lastName, message.newChat.lastSent, message.newChat.recentMessage);

            //Open Chat, set selectedChat to new chat window
            self.openChat(message.receiver._id);
            self.selectedChat = message.newChat._id;

            //Update recent message in chat window
            $('[data-chatid="' + message.newChat._id + '"]').find('p').text(message.newChat.recentMessage);

            //Add event listener to new chat window
            $('[data-chatid="' + message.newChat._id + '"]').on('click', function(){
                self.selectedChat = message.newChat._id;
                self.openChat(message.receiver._id);
            });

            //Not searching anymore, set it to false
            self.searchMode = false;
        } else {
            //Else we append outgoing message
            self.appendOutgoingMessage(message.message, '7:50 PM');

            //Update recent message in chat window and auto scroll to bottom if scrollable
            $('[data-chatid="' + self.selectedChat + '"]').find('p').text(message.message);
            $('.msg_history').scrollTop($('.msg_history')[0].scrollHeight); 
        }
    })
    .catch(function(err){
        console.log(err);
    })
}

Chat.prototype.startSearch = function(){
    this.searchMode = true;
    $('.inbox_chat').addClass('d-none');
    $('#sidebarTitle').html('<i class="fa fa-arrow-left"></i>');
    $('#start-search-box').removeClass('d-none');
}
                    
Chat.prototype.goBack = function(){
    $('.inbox_chat').removeClass('d-none');
    $('#sidebarTitle').html('Recent');
    $('#start-search-box').addClass('d-none');
}
                    
Chat.prototype.searchUser = function(e){
    var self = this;
    clearTimeout(this.debounceTimeout);
                    
    this.debounceTimeout = setTimeout(function(){
        $.get(self.url + '/api/users/user/' + e.target.value)
            .then(function (data) {
                $('#start-search-box').html("");
                self.renderSearchResults(data);
            })
            .catch(function (error) {
                $('#start-search-box').html("");
            });
    }, 750);
}
                        
Chat.prototype.renderSearchResults = function(users){
    var self = this;
    $.each(users, function(index, user){
          $('#start-search-box').append(
            '<div data-searchid="' + user._id + '" class="chat_list">' +
            '<div class="chat_people">' +
              '<div class="chat_img">' +
                  '<img src="https://ptetutorials.com/images/user-profile.png" alt="sunil">' +
              '</div>' +
              '<div class="chat_ib">' +
                '<h5 style="margin-bottom: 0px !important;">' + user.firstName + ' ' + user.lastName + '</h5>' +
                '<p>' + user.username + '</p>' +
              '</div>' +
            '</div>' +
          '</div>'
        )
                  
        //Click event for User with Username
        $('[data-searchid="' + user._id + '"]').on('click', function(){
            self.openChat(user._id);
        });
    })
}

Chat.prototype.initSocket = function(user){
    var self = this;
    var socket = io('http://localhost:8080');
    //User creates their own unique room
    socket.emit('join', { id: user._id });

    socket.on('new_message', function(data){
        //If the chat does not exist, create a new one.
        if(data.newChat && data.user){
            var chat = $('[data-chatid="' + data.newChat._id + '"]')
            if(!chat.length){
                //Append new chat if no such chat exists yet.
                self.appendNewChat(data.newChat._id, data.newChat.sender, data.user.firstName, data.user.lastName, data.newChat.lastSent, data.newChat.recentMessage);    
                chat.find('p').text(data.newChat.recentMessage);
    
                $('[data-chatid="' + data.newChat._id + '"]').on('click', function(){
                    self.selectedChat = data.newChat._id;
                    self.openChat(data.user._id);
                });
            }
        }

        //If the current chat is already opened, add incoming message
        if(data.chatID && data.message){
            var chat = $('[data-chatid="' + data.chatID + '"]')
            if(data.chatID == self.selectedChat){
                self.appendIncomingMessage(data.message, '7:50 PM');
                chat.find('p').text(data.message);
                $('.msg_history').scrollTop($('.msg_history')[0].scrollHeight);
            }
            //If the chat is not open, just update the recent message in chat window.
            else {
                chat.find('p').text(data.message);
            }
        }

    })
}

$(document).ready(function(){
    var chat = new Chat();
    chat.loadUserProfile();
    chat.renderChats();
})