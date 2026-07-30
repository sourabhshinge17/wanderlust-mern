const Listing = require("../models/listing");
const { uploadToCloudinary } = require("../cloudconfig");
const axios = require("axios");

function attachAvgRating(listings) {
    listings.forEach((listing) => {
        if (listing.reviews.length > 0) {
            const total = listing.reviews.reduce((sum, review) => sum + review.rating, 0);
            listing.avgRating = total / listing.reviews.length;
        } else {
            listing.avgRating = null;
        }
    });
}

module.exports.index = async (req, res) => {

    const { category, location } = req.query;
    let filter = {};

    // "Trending" is a sort mode, not a stored field — don't filter on it
    if (category && category !== "Trending") {
        filter.category = category;
    }
    if (location) {
    filter.$or = [
        { title: { $regex: location, $options: "i" } },
        { location: { $regex: location, $options: "i" } },
        { country: { $regex: location, $options: "i" } },
    ];
}
    let allListings = await Listing.find(filter).populate("reviews");

    if (!category || category === "Trending") {
        // "Trending" = most-reviewed first (cheap proxy until you track view counts)
        allListings.sort((a, b) => b.reviews.length - a.reviews.length);
    }

    attachAvgRating(allListings);

    res.render("listings/index", {
        allListings,
        activeCategory: category || "Trending",
        searchLocation: location || "",
    });
};

// NEW: powers the "My Listings" navbar link
module.exports.myListings = async (req, res) => {
    const allListings = await Listing.find({ owner: req.user._id }).populate("reviews");
    attachAvgRating(allListings);

    res.render("listings/index", {
        allListings,
        activeCategory: "Trending",
        searchLocation: "",
    });
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

    const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: `${req.body.listing.location}, ${req.body.listing.country}`, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'Wanderlust-App' }
    });
    newListing.lat = geoRes.data[0]?.lat || 0;
    newListing.lng = geoRes.data[0]?.lon || 0;

    await newListing.save();

    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    attachAvgRating([listing]);   // reuse your existing helper so avgRating shows on show.ejs too

    res.render("listings/show", { listing });
};
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    listing.set(req.body.listing);

    const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: `${req.body.listing.location}, ${req.body.listing.country}`, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'Wanderlust-App' }
    });
    listing.lat = geoRes.data[0]?.lat || 0;
    listing.lng = geoRes.data[0]?.lon || 0;

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
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listings");
    }

    let orignalImageUrl = listing.image.url;
    orignalImageUrl = orignalImageUrl.replace("/upload", "/upload/h_300,w_250");

    res.render("listings/edit", {
        listing,
        orignalImageUrl,
        categories: Listing.CATEGORIES,
    });
};
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new", {
        categories: Listing.CATEGORIES,
    });
};