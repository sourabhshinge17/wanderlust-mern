if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("./models/listing.js");

const MONGO_URI = "mongodb://127.0.0.1:27017/wanderlust";

async function backfill() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const listings = await Listing.find({
        $or: [{ lat: { $exists: false } }, { lat: 0 }, { lat: null }]
    });

    console.log(`Found ${listings.length} listings without coordinates`);

    for (let listing of listings) {
        try {
            const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: `${listing.location}, ${listing.country}`,
                    format: 'json',
                    limit: 1
                },
                headers: { 'User-Agent': 'Wanderlust-App' }
            });

            listing.lat = geoRes.data[0]?.lat || 0;
            listing.lng = geoRes.data[0]?.lon || 0;
            await listing.save();

            console.log(`✅ ${listing.title} (${listing.location}) → lat: ${listing.lat}, lng: ${listing.lng}`);
        } catch (err) {
            console.log(`❌ Failed for ${listing.title}:`, err.message);
        }

        // Nominatim rate limit = 1 request/sec, so wait between calls
        await new Promise(resolve => setTimeout(resolve, 1100));
    }

    console.log("Backfill complete.");
    mongoose.connection.close();
}

backfill();