var auth = require('../index');

require('./test_helper');

var mongoose = require('mongoose');

/* Create a test User schema */
var Schema = mongoose.Schema;

var accountSchema = new Schema({
    email: String,
    hashed_password: String,
    salt: String,
    entitlements: [String]
});

auth.makeAuthable(accountSchema);

var Account = mongoose.model('Account', accountSchema);

/* Test app to test routing enhancements */
var app = require('express')();

app.use(require('body-parser')());
app.use(require('cookie-session')({
    secret: 'asdf',
}));

app.post('/login', function(req, res) {
    auth.loginUser(req, res, {
        email: req.body.email,
        password: req.body.password,
        user_model: Account,
        default_redirect: '/welcome'
    }, function(err, user) {
        if(err) {
            res.status(400).json(err);
        } else {
            // add something to the response just to show the callback was 
            // invoked
            res.set('test', 'howdy');
        }
    });
});

var requireUser = function() {
    return auth.requireUser({
        user_model: Account,
        login_url: '/login'
    }, function(err, r) {
        // add a header to test that the callback happens
        if(err) {
            throw err;
        } else {
            r.res.set('success', 'yup');
        }
    });
};

app.get('/require_user', requireUser(), function(req, res) {
    res.status(200).json({ email: res.locals.currentUser.email });
});

var request = require('supertest');

var expect = require('expect.js');


describe('login', function() {

    var account;

    beforeEach(function(done) {
        account = new Account({
            email: 'davebenvenuti@gmail.com',
            password: 'my password',
            password_repeat: 'my password'
        });

        account.save(function(err) {
            if(err) throw err;

            done();
        });
    });

    it('should redirect on successful login and invoke callback', function(done) {
        request(app)
            .post('/login')
            .send({ email: 'davebenvenuti@gmail.com', password: 'my password' })
            .end(function(err, res) {
                expect(err).to.be(null);

                expect(res.status).to.eql(302);
                expect(res.headers['location']).to.eql('/welcome');

                // added by our custom callback
                expect(res.headers['test']).to.eql('howdy');

                done();
            });
    });


    it('should reject bad logins', function(done) {
        request(app)
            .post('/login')
            .send({ email: 'davebenvenuti@gmail.com', password: 'bad password' })
            .end(function(err, res) {
                expect(err).to.be(null);

                // the custom callback sets the status
                expect(res.status).to.eql(400);

                done();
            });
    });
});

var agent = require('superagent');

describe('require user', function() {
    var account;

    beforeEach(function(done) {
        account = new Account({
            email: 'davebenvenuti@gmail.com',
            password: 'my password',
            password_repeat: 'my password'
        });

        account.save(function(err) {
            if(err) throw err;

            done();
        });
    });

    it('should set currentUser local on response on success', function(done) {
        // login first
        var a = agent.agent();

        request(app)
            .post('/login')
            .send({ email: 'davebenvenuti@gmail.com', password: 'my password' })
            .end(function(err, res) {
                expect(err).to.be(null);

                a.saveCookies(res);

                var r = request(app)
                    .get('/require_user');

                a.attachCookies(r);

                r.end(function(err, res) {
                    expect(err).to.be(null);

                    expect(res.status).to.eql(200);
                    expect(res.body.email).to.eql('davebenvenuti@gmail.com');

                    // test our customer handler
                    expect(res.headers['success']).to.eql('yup');

                    done();
                });
            });
    });

    it('should redirect to /login on auth failure', function(done) {
        
        request(app)
            .get('/require_user')
            .end(function(err, res) {
                expect(err).to.be(null);

                expect(res.status).to.eql(302);
                expect(res.headers['location']).to.eql('/login');

                done();
            });
    });
});

