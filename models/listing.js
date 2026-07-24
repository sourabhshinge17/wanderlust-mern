const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
  filename: { type: String, default: "listingimage" },
  url: {
    type: String,
    default: "https://picsum.photos/400/400?random=1",
    set: (v) => v === "" ? "https://picsum.photos/400/400?random=1" : v
  }
},
  price: Number,
  location: String,
  country: String,
  lat: Number,
  lng: Number,

  reviews: [
    {
        type: Schema.Types.ObjectId,
        ref: "Review",
    }
],
  owner : {
    type : Schema.Types.ObjectId,
    ref : "User",
  }
});

listingSchema.post("findOneAndDelete", async(listing) => {
  if(listing) {
    await Review.deleteMany({_id : {$in : listing.reviews}});
  }
  
})
module.exports = mongoose.model('Listing', listingSchema);