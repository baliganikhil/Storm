var mongoose = require('mongoose');

var statuses = ['open', 'closed', 'as_expected'];
var priorities = ['major','regular','minor','enhancement'];

var Comment = new mongoose.Schema(
        {
            comment: String,
            username: String,
            name: String,
            dca: {type: Date, default: Date.now}
        }
    );

var Bug = new mongoose.Schema(
        {
            id: {type: String},
            name: {type: String, required: true},
            desc: String,
            status: {type: String, default: 'open'},
            priority: {type: String, default: 'regular'},

            username: { type: String, required: true},
            reported_by: {type: String},
            company: {type: String, required: true},

            comments: [Comment],

            dca: {type: Date, default: Date.now},
            dua: Date
        }
    );

Bug.pre('save', function(next) {
    if (this.id === undefined) {
        this.id = (new Date()).getTime().toString();
    }

    now = new Date();
    this.dua = now;
    next();
});

module.exports = mongoose.model('Bug', Bug);
