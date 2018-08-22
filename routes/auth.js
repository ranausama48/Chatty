const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const { secret } = require('../config');

function tokenForUser(user){
	const timestamp = new Date().getTime();
	return jwt.sign({ sub: user._id, iat: timestamp }, secret);
}

router.post('/signUp', async (req, res, next) => {
  const { username, password, firstName, lastName } = req.body;
  const newUser = new User({ username, password, firstName, lastName });

  if(!username || !firstName || !lastName){
  	return res.status(422).send({ error: 'You must fill in all the required fields.' });
  }

	try {
		const existingUser = await User.findOne({ username });
		if(existingUser){
			return res.status(422).send({ error: 'Username already in use.' });
		}
	} catch (err){
		next(err);
	}

	try {
		const saved = await newUser.save();
		res.status(200);
		res.json({ message: 'Your account was registered!' });
		return true;
	} catch(err) {
		console.log(err);
		console.log(`Internal Server Error, User.save(${JSON.stringify(newUser)})`);
		return false;
	}
});

router.post('/signIn', async (req, res, next) => {
	const { username, password } = req.body;

	try {
		const user = await User.findOne({ username })
		if(!user){
			res.status(404).json({ error: 'Incorrect Username or Password. Please try again.' });
		} else {
			try {
				const isMatch = await user.isProperPassword(password);
				if(isMatch){
					const token = tokenForUser(user);
					res.json({ token });
				} else {
					res.status(401);
					res.json({ error: 'No matching records were found. Please try again.' });
				}
			} catch(err) {
				console.log(err, `Internal Error, User.isProperPassword(${password})`);
				res.status(500);
			}
			
		}
	} catch(err){
		console.log(err, `Internal Server Error, User.findOne(${username})`);
		res.status(500);
	}
	
});

module.exports = router;