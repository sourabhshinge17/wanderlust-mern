const Listing = require("./models/listing");
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema , reviewSchema} = require("./views/schema.js");
const Review = require("./models/review.js"); 

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; // original URL
        req.flash("error", "You must be logged in first!");
        return res.redirect("/login");
    }
    next();
};
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};


module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listings");
    }

    if (!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You're not the owner of this listing.");
        return res.redirect(`/listings/${id}`);
    }

    next();
};


// Validation Middleware listings
    module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

// Validation Middleware reviews
    module.exports.validateReview = (req, res, next) => {

    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }

    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;

    let review = await Review.findById(reviewId);

    if (!review) {
        req.flash("error", "Review not found — it may already be deleted.");
        return res.redirect(`/listings/${id}`);
    }

    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You're not the author of this review.");
        return res.redirect(`/listings/${id}`);
    }

    next();
};
