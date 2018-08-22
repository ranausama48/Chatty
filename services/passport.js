const mongoose = require('mongoose');
const { secret } = require('../config');
const User = mongoose.model('User');
const { Strategy, ExtractJwt } = require('passport-jwt');

function initPassport(passport){
	const opts = {
		jwtFromRequest: ExtractJwt.fromHeader('authorization'),
		secretOrKey: secret
	}

	passport.use(new Strategy(opts, async (payload, done) => {
		try {
			const user = await User.findById(payload.sub);
			return user ? done(null, user) : done(null, false);
		} catch(err){
			done(err, false);
		}
	}));
}

module.exports = initPassport;