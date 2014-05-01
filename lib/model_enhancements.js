var crypto = require('crypto');

/*
 * Make a Mongoose model authenticatable.  The model is assumed to have the 
 * String attributes hashed_password and salt.  Adds before save validators
 * to ensure the presence of a password (and repeat), as well as functionality 
 * to automatically hash and salt passwords, as well as password validation
 *
 * parameters:
 *
 *   - User - mongoose schema for the user BEFORE it's been activated by a call
 *            to mongoose#model
 */
var makeAuthable = function(User) {
    User.virtual('password')
        .set(function(password) {
            this._password = password;
            this.salt = this.makeSalt();
            this.hashed_password = (password && this.encryptPassword(password));
        })
        .get(function() { return this._password; });
    
    User.virtual('password_repeat')
        .set(function(password_repeat) {
            this._password_repeat = password_repeat;
        })
        .get(function() { return this._password_repeat; });

    User.method('isValidPassword', function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    });

    User.method('makeSalt', function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    a});

    User.method('encryptPassword', function(password) {
        // TODO we want to be using bcrypt here

        return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    });

    User.pre('save', function(next) {
        var modifiedPaths = this.modifiedPaths();
        
        if ((this.isNew || (modifiedPaths.indexOf('password') > -1)) && !(this.password && this.password.length)) {
            next(new Error('Invalid password'));                
        } else if(this.password != this.password_repeat) {
            next(new Error("Password and Password Repeat don't match"));
        } else {
            next();
        }
    });
};

exports.makeAuthable = makeAuthable;

