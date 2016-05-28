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
    var company = req.user.company;

    Bug.find({company: company}, {_id: 0, company : 0, __v: 0}).sort({dua: -1}).limit(100).exec(function (err, bug_docs) {
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
        comment = req.body.comment;

    Bug.findOne({id: bug_id, company: company}, function (err, bug_doc) {
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

        Bug.update({id: bug_id, company: company}, bug_doc, function (err) {
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
        company = req.user.company;

    Bug.findOne({id: bug_id, company: company}, function (err, bug_doc) {
        if (err) {
            res.status(500);
            res.send({status: 'error', data: err});
            return;
        }

        res.send({status: 'success', data: bug_doc});
    });
};