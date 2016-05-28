var mongoose = require('mongoose');

var User = new mongoose.Schema(
        {
            username: { type: String, lowercase: true, trim: true, index: { unique: true } },
            name: {type: String, required: true},
            company: {type: String, required: true},
            phone: {type: String, default: ""},
            hash: String,

            primary: {type: Boolean, default: false},
//            referrer: {type: String},

            notif_sms: {type: Boolean, default: true},
            notif_email: {type: Boolean, default: true},
            notif_app: {type: Boolean, default: true},
            notif_newsltr: {type: Boolean, default: true},

            dca: {type: Date, default: Date.now},
            dua: Date
        }
    );

User.pre('save', function(next) {
    now = new Date();
    this.dua = now;
    next();
});

module.exports = mongoose.model('User', User);
