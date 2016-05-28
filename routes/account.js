var COMMON = require('./common');
var bcrypt = require('bcrypt');
var fs = require('fs');
var path = require('path');
var User = require('../models/account');

function create_auth_token(username, password, callback) {
    bcrypt.hash(password, 8, function (err, hash) {
        callback(hash);
    });
}

function authenticate(username, hash, callback) {
    User.findOne({
        username: username,
        hash: hash
    }, function (err, doc) {
        if (err) {
            callback(err);
            return;
        }

        var authenticated = (doc !== null),
            payload = {
                authenticated: authenticated,
                username: username,
                name: undefined
            };

        if (authenticated) {
            payload.name = doc.name;
            payload.company = doc.company;
        }

        callback(false, payload);
    });
}

function login(username, password, callback) {
    User.findOne({
        '$or': [{
            username: username
        }, {
            phone: username
        }]
    }, {
        hash: 1,
        name: 1,
        username: 1,
        phone: 1,
        company:1

    }, function (err, doc) {
        if (err) {
            callback(err);
            return;
        } else if (COMMON.noe(doc)) {
            callback({
                message: 'User does not exist'
            });
            return;
        }

        bcrypt.compare(password, doc.hash, function (err, result) {
            if (result) {
                console.log("Logged in");
                callback(err, {
                    auth: result,
                    __auth: doc.hash,
                    name: doc.name,
                    username: doc.username,
                    phone: doc.phone,
                    company: doc.company
                });
            } else {
                callback(err, {
                    auth: result
                });
            }
        });
    });
}

function register(data, callback) {
    if (COMMON.noe(data.username)) {
        callback({
            message: 'Username not found'
        });
        return;
    }

    if (COMMON.noe(data.password)) {
        callback({
            message: 'Password not found'
        });
        return;
    }

    create_auth_token(data.username, data.password, function (hash) {
        var doc = {
            username: data.username,
            hash: hash,
            name: data.name,
            phone: data.phone,
            company: data.company,
            primary: data.primary
        };

        (new User(doc)).save(function (err, doc) {

            callback(err, {
                status: 'success',
                data: 'User has been successfully registered',
                user_doc: doc
            });
        });

    });
}

exports.authenticated = function (req, callback) {
    var username = req.cookies.username,
        __auth = req.cookies.__auth,
        authorization = req.headers.authorization;

    if (!COMMON.noe(authorization)) {
        authorization = authorization.split(':');
        username = authorization[0];
        __auth = authorization[1];
    }

    if (COMMON.noe(username)) {
        callback({
            code: 401,
            err: true,
            data: 'Looks like you are not signed in'
        });
        return;
    }

    authenticate(username, __auth, function (err, response) {
        if (err) {
            callback({
                code: 401,
                err: true
            });
            return;
        }

        response.code = 200;

        callback(response);

    });
};

exports.signedin = function (req, res) {
    exports.authenticated(req, function (response) {
        if (response.err) {
            res.status(response.code);
        }

        if (response.authenticated) {
            response.status = 'success';
        } else {
            response.status = 'error';
        }

        delete response.code;

        res.send(response);
    });
};

function set_auth_cookie(res, __auth, username, name, company) {
    res.cookie('__auth', __auth);
    res.cookie('username', username);
    res.cookie('name', name);
    res.cookie('company', company);

    return res;
}

exports.login = function (req, res) {
    var username = req.body.username,
        password = req.body.password;

    login(username, password, function (err, response) {
        if (err) {
            res.status(401);
            res.send({
                err: true,
                data: err.message
            });
            return;
        }

        if (response.auth) {
            /*            res.cookie('__auth', response.__auth);
                        res.cookie('username', username);
                        res.cookie('name', response.name);*/

            res = set_auth_cookie(res, response.__auth, response.username, response.name, response.company);
        }

        res.send(response);
    });

};

exports.register = function (req, res) {
    var user = req.body,
        company = user.company,
        username = user.username,
        referrer = user.referrer;

    actually_register();

    function actually_register() {
        register(user, function (err, response) {
            if (err) {
                var data = err.message;
                if (err.code === 11000) {
                    data = 'This username has already been taken';
                }

                res.send({
                    status: 'error',
                    data: data
                });
                return;
            }

            delete response.user_doc;

            res.send(response);
        });
    }
};

exports.logout = function (req, res) {
    res.cookie('username', '');
    res.cookie('name', '');
    res.cookie('company', '');
    res.cookie('__auth', '');

    res.send({
        status: 'success'
    });
};

