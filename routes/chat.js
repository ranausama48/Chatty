const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Chat = mongoose.model('Chat');

const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

//Getting users chats
router.get('/chats', requireAuth, async(req, res, next) => {
    let users = [];
    const exclude = '-password -__v';

    try {
        const chats = await Chat.find({ participants: { '$in': [req.user.id] } })
        .select('participants lastSent recentMessage');

        for(chat of chats){
            let updatedChat = {
                _id: chat._id,
                recentMessage: chat.recentMessage,
                lastSent: chat.lastSent
            };

            const foundUsers = await User.find({
                '_id': { $in : [
                    mongoose.Types.ObjectId(chat.participants[0]),
                    mongoose.Types.ObjectId(chat.participants[1])
                ]}
            }).select(exclude);

            updatedChat.participants = foundUsers;
            users.push(updatedChat);
        }

        res.send(users);
    } catch(err){
        console.log(err);
    }
})

//Getting chats between you and some other user
router.get('/chats/:userId', requireAuth, async function(req, res, next) {
    const { userId } = req.params;
    const exclude = '-participants -recentMessage -sender'

    try {
        const chat = await Chat.findOne({ participants: { '$all': [req.user.id, userId] } })
        .select(exclude);
        if(chat){
            res.send(chat);
        } else {
            console.log('Error');
        }
    } catch (err){
        console.log(err);
    }
})

//Send Chat Message to User with id
router.post('/send/:userId', requireAuth, async function(req, res, next) {
    const { userId } = req.params;
    const { message } = req.body;

    try {
        const chat = await Chat.findOne({ participants: { '$all': [req.user.id, userId] } });
        if(!chat){
            const newMessage = { message, meta: { user: req.user.id } };

            const chat = new Chat({
                sender: req.user.id,
                messages: newMessage,
                participants: await getParticipants(req.user.id, userId),
                lastSent: new Date(),
                recentMessage: message
            });

            try {
                const newChat = await chat.save();
                //Emitting New Message to User with ID: userId, passing newChat object
                //and info about user who is sending the message
                const receiver = await User.findById(userId);

                req.io.sockets.in(userId).emit('new_message', 
                    { 
                        newChat,
                        user: {
                            _id: req.user.id,
                            firstName: req.user.firstName,
                            lastName: req.user.lastName
                        }
                    }
                );
                res.send(
                    { 
                        newMessage, 
                        newChat, 
                        receiver: { 
                            _id: receiver._id,
                            firstName: receiver.firstName,
                            lastName: receiver.lastName
                        }
                    }
                );
            } catch(err){
                console.log(err);
            }

        } else if(chat) {
            let sendMessage = {
                message, 
                meta: { user: req.user.id }
            }

            chat.lastSent = new Date();
            chat.recentMessage = message;
            chat.messages.push(sendMessage);

            //Emitting New Message to User with ID: userId, passing newChat object
            req.io.sockets.in(userId).emit('new_message', {
                chatID: chat._id,
                message
            });

            chat.save();
            res.send(sendMessage);
        }
    } catch (err){
        console.log(err);
    }
});

async function getParticipants(senderId, receiverId){
    const exclude = '-password -__v';

    try {
        const findUsers = await User.find({
            '_id': { $in : [
                mongoose.Types.ObjectId(senderId),
                mongoose.Types.ObjectId(receiverId)
            ]}
        }).select(exclude);
        console.log(findUsers);
        return findUsers;
    } catch(err){
        console.log(err);
    }
}

module.exports = router;