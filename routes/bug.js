var Bug = require('../models/bug');
var AccountAPI = require('./account');
var COMMON = require('./common');

exports.create_bug = function (req, res) {
    var bug = req.body,
        company = req.user.company,
        reported_by = req.user.name,
        username = req.user.username;

    bug.bug_id = (new Date()).getTime().toString();
    bug.company = company;
    bug.reported_by = reported_by;
    bug.username = username;

    (new Bug(bug)).save(function (err, task_doc) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        res.send({status: 'success', data: task_doc});
    });
};

exports.get_bugs = function (req, res) {
    var company = req.user.company,
        is_admin = req.user.is_admin,
        query = {},
        fields = {};

    query = {company: company};
    fields = {_id: 0, __v: 0, company: 0, comments: 0};

    if (is_admin) {
        delete fields.company;
        delete query.company;
    }

    Bug.find(query, fields).sort({dua: -1}).limit(100).exec(function (err, bug_docs) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        res.send({status: 'success', data: bug_docs});
    });
};

exports.add_comment = function (req, res) {
    var bug_id = req.body.id,
        company = req.user.company,
        username = req.user.username,
        name = req.user.name,
        is_admin = req.user.is_admin,
        comment = req.body.comment,
        query = {id: bug_id, company: company};

    if (is_admin) {
        delete query.company;
    }

    Bug.findOne(query, function (err, bug_doc) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        if (COMMON.noe(bug_doc)) {
            res.status(400);
            res.send({status: 'error', data: 'Could not find that issue'});
            return;
        }

        var comment_doc = {
            comment: comment,
            username: username,
            name: name,
            dca: new Date()
        };

        bug_doc = JSON.parse(JSON.stringify(bug_doc));

        bug_doc.comments.push(comment_doc);

        Bug.update({id: bug_id}, bug_doc, function (err) {
            if (err) {
                res.status(500);
                res.send({status: 'error', data: err});
                return;
            }

            res.send({status: 'success', data: 'Comment added successfully'});
        });
    });

};

exports.get_bug = function (req, res) {
    var bug_id = req.params.bug_id,
        company = req.user.company,
        is_admin = req.user.is_admin,
        query = {};

    query = {id: bug_id, company: company};

    if (is_admin) { delete query.company; }

    Bug.findOne(query, function (err, bug_doc) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        res.send({status: 'success', data: bug_doc});
    });
};

exports.change_status = function (req, res) {
    var bug_id = req.body.id,
        status = req.body.status,
        company = req.user.company,
        username = req.user.username,
        name = req.user.name,
        is_admin = req.user.is_admin,
        query = {id: bug_id};

    if (!is_admin) {
        res.status(401);
        res.send({status: 'error', data: 'You are not authorised'});
        return;
    }

    Bug.findOne(query, function (err, bug_doc) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        if (COMMON.noe(bug_doc)) {
            res.status(400);
            res.send({status: 'error', data: 'Could not find that issue'});
            return;
        }

        bug_doc = JSON.parse(JSON.stringify(bug_doc));

        bug_doc.status = status;

        Bug.update({id: bug_id}, bug_doc, function (err) {
            if (err) {
                res.status(500);
                res.send({status: 'error', data: err});
                return;
            }

            res.send({status: 'success', data: 'Status updated successfully'});
        });
    });
};

exports.change_priority = function (req, res) {
    var bug_id = req.body.id,
        priority = req.body.priority,
        company = req.user.company,
        username = req.user.username,
        is_admin = req.user.is_admin,
        name = req.user.name,
        query = {id: bug_id};

    if (!is_admin) {
        res.status(401);
        res.send({status: 'error', data: 'You are not authorised'});
        return;
    }

    Bug.findOne(query, function (err, bug_doc) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        if (COMMON.noe(bug_doc)) {
            res.status(400);
            res.send({status: 'error', data: 'Could not find that issue'});
            return;
        }

        bug_doc = JSON.parse(JSON.stringify(bug_doc));

        bug_doc.priority = priority;

        Bug.update({id: bug_id}, bug_doc, function (err) {
            if (err) {
                res.status(500);
                res.send({status: 'error', data: err});
                return;
            }

            res.send({status: 'success', data: 'Priority updated successfully'});
        });
    });
};