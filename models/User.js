const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

const User = new Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    friends: [{}]
})

User.pre('save', async function(next) {
	const user = this;

	if(this.isModified('password') || this.isNew){
		try {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(user.password, salt);
			user.password = hash;
		} catch (err) { 
			next(err);
		}

		next();
	}
})

User.methods.isProperPassword = function(clientPassword) {
	return new Promise(async (resolve, reject) => {
		try {
			const isMatch = await bcrypt.compare(clientPassword, this.password);
			resolve(isMatch);
		} catch(err){
			console.log(err, 'Error in BCrypt Password Comparison');
			reject(err);
		}
	})
}

module.exports = User;