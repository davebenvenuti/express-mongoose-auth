var mongoose = require('mongoose');

var AuthenticationFailure = function() {
    this.name = 'AuthenticationFailure';
    this.message = 'Invalid username or password';
};

/*
 * Helper method used to log in users in the context of an express route.
 * Looks up the user in mongo and puts the id in the session
 *
 * parameters:
 *   req - express request
 *   res - express response
 *   options - object with the following keys:
 *     - password - required
 *     - user_model - optional, defaults to mongoose.model('User')
 *     - default_redirect - optional, where to go after login if no return_to is
 *                          present.  defaults to '/'
 *     - email/username/whatever - the fourth parameter will be assumed to be
 *                                 a unique lookup for the user; what you'd see
 *                                 in the login form
 *  callback - will be passed an error (if any) and the authenticated user 
 *             (if any) 
 *
*/
var loginUser = function(req, res, options, callback) {
    var query = {};

    for(var attr in options) {
        if(['password', 'user_model', 'default_redirect'].indexOf(attr) == -1) {
            query[attr] = options[attr];

            break;
        }
    }

    var User = options.user_model || mongoose.model('User');
    var defaultRedirect = options.default_redirect || '/';

    User.findOne(query, function(err, user) {
        if(user && user.isValidPassword(options.password)) {
            req.session.user_id = user.id;

            if(typeof(callback) == 'function') {
                callback(null, user);
            }

            if(req.session.return_to) {
                var returnTo = req.session.return_to;

                delete req.session['return_to'];

                res.redirect(returnTo);
            } else {                    
                res.redirect(defaultRedirect);
            }
        } else {
            if(typeof(callback) == 'function') {
                callback(new AuthenticationFailure());
            }
        }
    });
};

exports.loginUser = loginUser;

var P = require('bluebird');


/*
 * Express middleware generator for routes that will require a login 
 *
 * parameters:
 *
 *   opts - optional keys user_model (defaults to mongoose.model('User')), and
 *          login_url (defaults to '/login')
 *
 * returns:
 *
 *   Express middleware; a function with the signature (req, res, next)
 *
*/

var requireUser = function(opts, callback) {
    var User = (opts && opts.user_model) || require('mongoose').model('User');
    var loginUrl = (opts && opts.login_url) || '/login';

    return function(req, res, next) {

        var findUserById = function(id) {
            // TODO why didn't P.promisify work here?
            var deferred = P.pending();

            User.findById(id, function(err, u) {
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(u);
                }
            });

            return deferred.promise;
        }

        var redirectToLogin = function() {
            req.session.return_to = req.originalUrl;

            res.redirect(loginUrl);
        };       

        if(req.session.user_id) {
            findUserById(req.session.user_id)
                .then(function(user) {            
                    if(user) {
                        res.locals.currentUser = user;

                        if(typeof(callback) == 'function') {
                            callback(null, { req: req, res: res });
                        }

                        next();
                    } else {        
                        redirectToLogin();
                    }
                })
                .catch(function(err) { 

                    if(typeof(callback) == 'function') {
                        callback(err, null);
                    }

                    redirectToLogin();
                })
        } else {
            redirectToLogin();
        }
    };
};

exports.requireUser = requireUser;

