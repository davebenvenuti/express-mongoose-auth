express-mongoose-auth
=====================

Username/password auth for express apps with Mongoose-backed user models

[![Build Status](https://secure.travis-ci.org/davebenvenuti/express-mongoose-auth.png)](http://travis-ci.org/davebenvenuti/express-mongoose-auth)

## Getting Started

Install with npm

  $ npm install express-mongoose-auth

## Model Setup

express-mongoose-auth assumes you have some sort of User model backed by Mongoose.  

Define your schema as normal.  Note that express-mongoose-auth requires you to have *salt* and *hashed_password* String attributes:

```js
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  email: String,
  hashed_password: String,
  salt: String
})
```

Before defining the model with mongoose#model:

```js
var auth = require('express-mongoose-auth');

auth.makeAuthable(userSchema);
```

This will define methods to facilitate password hashing, validation, etc.  Finally, declare the model as normal:

```js
mongoose.model('User', userSchema);
```

## Route setup

In your routes, first you'll want to log users in:

```js
var app = require('express')();

app.use(require('body-parser')());
...

app.post('/login', function(req, res) {
  auth.loginUser(req, res, {
    email: req.body.email,
    password: req.body.password,
    default_redirect: '/something_you_need_to_be_logged_in_to_see',
    user_model: User // optional, defaults to mongoose.model('User')
  }, function(err) {
    if(err) {
      if(err.type == 'AuthenticationFailure') {
        res.status(400).send('denied'); // or however you'd handle that
      } else {
        res.status(500).send('whoops');
      }
    }
  });
});


```

Then, in your routes you want to require authentication in:

```js
var myRequireUser = function() {

  // This generates standard express middleware with a signature of (req, res, next)
  return auth.requireUser({
    login_url: '/my_different_login_url', // optional, defaults to '/login'
    user_model: User                      // optional, defaults to mongoose.model('User')
  });
};

app.get('/something_you_need_to_be_logged_in_to_see', myRequireUser(), function(req, res) {
  res.status(200).send('Welcome, authenticated user!');
});

```

## TODO

* Use bcrypt
* Entitlements support
* Lots

