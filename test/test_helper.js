var mongoose = require('mongoose');

var connectDb = function(done) {
    mongoose.connect('mongodb://localhost/express-mongoose-auth-test', done);
};

var disconnectDb = function(done) {
    mongoose.disconnect(done);
};

var clearDb = function(done) {
    mongoose.connection.db.dropDatabase(done);
};

before(connectDb);
after(disconnectDb);

beforeEach(clearDb);

