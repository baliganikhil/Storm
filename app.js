
/**
 * Module dependencies.
 */

var express = require('express');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var mongoose = require('mongoose');

var AccountAPI = require('./routes/account'),
    BugApi = require('./routes/bug'),
    COMMON = require('./routes/common');


var app = express();

// all environments
app.set('port', process.env.PORT || 5001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.cookieParser('some secret'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

mongoose.connect('mongodb://localhost:27017/storm');

app.get('/', function (req, res) {
  res.redirect('/storm.html');
});

app.post('/api/accounts/register', AccountAPI.register);
app.post('/api/accounts/login', AccountAPI.login);
app.get('/api/accounts/logout', AccountAPI.logout);

app.get('/api/bugs/list', authenticate, BugApi.get_bugs);
app.get('/api/bugs/:bug_id', authenticate, BugApi.get_bug);
app.post('/api/bugs/report', authenticate, BugApi.create_bug);
app.post('/api/bugs/comment', authenticate, BugApi.add_comment);
app.post('/api/bugs/status', authenticate, BugApi.change_status);
app.post('/api/bugs/priority', authenticate, BugApi.change_priority);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});




function authenticate(req, res, next) {
    AccountAPI.authenticated(req, function (auth_response) {
      if (!auth_response.authenticated) {
            res.status(401);
            res.send({status: 'error', data: 'You are not signed in'});
          return;
      }

      if (auth_response.is_admin && auth_response.company === 'Kraika') {
        auth_response.is_admin = true;
      }

      req.user = auth_response;

      next();
  });
}
