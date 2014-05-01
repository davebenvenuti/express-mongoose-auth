require('./test_helper');

var auth = require('../index');

var mongoose = require('mongoose');

var expect = require('expect.js');

/* Create a test User schema */
var Schema = mongoose.Schema;;

var userSchema = new Schema({
    'email': String,
    'hashed_password': String,
    'salt': String,
});

describe('user additions', function() {

    describe('#makeAuthable', function() {

        auth.makeAuthable(userSchema);

        var User = mongoose.model('User', userSchema);

        it('should define password and password_repeat getters and setters', function() {
            var user = new User();

            user.password = 'a password';
            expect(user.password).to.eql('a password');

            user.password_repeat = 'a password';
            expect(user.password_repeat).to.eql('a password');
        });

        it('should require a user', function(done) {
            var user = new User();

            user.save(function(err) {
                expect(err).to.be.ok();

                expect(err.message).to.eql('Invalid password');

                done();
            });
        });

        it('should validate that password and password_repeat are equal', function(done) {
            var user = new User();

            user.password = 'a password';
            user.password_repeat = 'a different password';

            user.save(function(err) {
                expect(err).to.be.ok();

                expect(err.message).to.eql("Password and Password Repeat don't match");

                user.password = 'a password';
                user.password_repeat = 'a password';

                user.save(function(err) {
                    expect(err).to.be(null);

                    done();
                });
            });
        });

        it('should hash and salt passwords', function(done) {
            var user = new User();

            user.password = 'a password';
            user.password_repeat = 'a password';

            user.save(function(err) {
                expect(err).to.be(null);

                // reload the user
                User.findById(user.id, function(err, user) {
                    expect(user.hashed_password).to.be.ok();
                    expect(user.salt).to.be.ok();

                    expect(user.hashed_password).not.to.eql('a password');

                    done();
                });
            });
        });

        it('should verify valid passwords', function(done) {
            var user = new User({
                email: 'my@email.com',
                password: 'a password',
                password_repeat: 'a password'
            });

            user.save(function(err) {
                expect(err).to.be(null);

                // reload the user
                User.findById(user.id, function(err, user) {
                    expect(user.isValidPassword('a password')).to.be(true);

                    expect(user.isValidPassword('another password')).to.be(false);

                    done();
                });
            });
        });

    });
});

