var P = require('bluebird');

var modelEnhancements = require('./lib/model_enhancements');

exports.makeAuthable = modelEnhancements.makeAuthable;


var routeEnhancements = require('./lib/route_enhancements');

exports.loginUser = routeEnhancements.loginUser;

exports.requireUser = routeEnhancements.requireUser;
exports.requireEntitlement = routeEnhancements.requireEntitlement;

