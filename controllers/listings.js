const Listing = require("../models/listing");
const { uploadToCloudinary } = require("../cloudconfig");
const axios = require("axios");

module.exports.index = async (req, res) => {

    const allListings = await Listing.find({})
        .populate("reviews");

    allListings.forEach((listing) => {

        if (listing.reviews.length > 0) {

            const total = listing.reviews.reduce((sum, review) => {
                return sum + review.rating;
            }, 0);

            listing.avgRating = total / listing.reviews.length;

        } else {

            listing.avgRating = null;

        }

    });

    res.render("listings/index", { allListings });

};


module.exports.createListing = async (req, res) => {
    const newListing = new Listing(req.body.listing);

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        newListing.image = {
            filename: result.public_id,
            url: result.secure_url,
        };
    }

    newListing.owner = req.user._id;

    // ADD THIS BLOCK
    const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: `${req.body.listing.location}, ${req.body.listing.country}`, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'Wanderlust-App' }
    });
    newListing.lat = geoRes.data[0]?.lat || 0;
    newListing.lng = geoRes.data[0]?.lon || 0;
    // END ADD

    await newListing.save();

    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {

    // Find the listing by ID
    // Also fetch reviews, review authors, and owner details

    const listing = await Listing.findById(req.params.id)

        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })

        .populate("owner");


    // If no listing exists, redirect safely
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }


    // -------------------------------
    // Calculate Average Rating
    // -------------------------------

    if (listing.reviews.length > 0) {

        // Add all ratings together
        const total = listing.reviews.reduce((sum, review) => {

            return sum + review.rating;

        }, 0);

        // Divide by number of reviews
        listing.avgRating = total / listing.reviews.length;

    } else {

        // No reviews yet
        listing.avgRating = null;

    }


    // Render the page
    res.render("listings/show", { listing });

};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    listing.set(req.body.listing);

    // ADD THIS BLOCK
    const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: `${req.body.listing.location}, ${req.body.listing.country}`, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'Wanderlust-App' }
    });
    listing.lat = geoRes.data[0]?.lat || 0;
    listing.lng = geoRes.data[0]?.lon || 0;
    // END ADD

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        listing.image = { filename: result.public_id, url: result.secure_url };
    }

    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        res.redirect("/listings");
    }

    module.exports.renderEditForm = async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);
         if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
}
        let orignalImageUrl = listing.image.url;
       orignalImageUrl = orignalImageUrl.replace("/upload","/upload/h_300,w_250")
        res.render("listings/edit", { listing , orignalImageUrl});
    }

   module.exports.renderNewForm =  (req, res) => {
    
    res.render("listings/new");
}