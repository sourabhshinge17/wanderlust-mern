const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose').default;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing"
        }
    ]
});

userSchema.plugin(passportLocalMongoose); // function first, no options needed unless customizing
module.exports = mongoose.model('User', userSchema);