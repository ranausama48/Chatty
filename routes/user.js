const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

router.get('/user/:username', requireAuth, async(req, res, next) => {
    const { username } = req.params;

    try {
        const user = await User.find({ username: { $regex: '.*' + username + '.*' } }, { 'chats': 0, 'password': 0 }).limit(5);
        user ? res.send(user) : res.status(204).send(`No users found with Username ${username}`);
    } catch(err){
        console.log(err);
    }
})

router.get('/current', requireAuth, async(req, res, next) => {
    res.send({
        _id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        friends: req.user.friends
    });
})

module.exports = router;