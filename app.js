const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');

//App
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const PORT = 8080 || process.env.port;
server.listen(PORT);
app.io = io;

io.on('connection', function (socket) {
    socket.on('join', function(user){
        //Create room with user's id
        socket.join(user.id);
    });
});

//Models
mongoose.model('User', require('./models/User'));
mongoose.model('Chat', require('./models/Chat'));

//Passport Authentication
app.use(passport.initialize());
require('./services/passport')(passport);

app.use(function(req, res, next){
    req.io = io;
    next();
})

//Logger, Body Parser
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//MongoDB Setup
const { mongoURI } = require('./config');
mongoose.connect(mongoURI, err => {
    if (err) throw err;
    else console.log('Successfully connected to MongoDB');
});

//Static Files
app.use(express.static('public'));

// Add headers
app.use(cors({origin: 'http://localhost:8080'}));

//Setting Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/chat', require('./routes/chat'));

module.exports = app;