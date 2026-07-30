// backfill.js
const mongoose = require('mongoose');
const Listing = require('./models/listing');
const axios = require('axios');

// Use the same DB as your app — read from .env or paste your actual URL here
require('dotenv').config();
const MONGO_URL = process.env.MONGO_URL || process.env.DB_URL || 'mongodb://127.0.0.1:27017/wanderlust';

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to:', MONGO_URL);

    const listings = await Listing.find({
        $or: [{ lat: null }, { lng: null }, { lat: 0, lng: 0 }]
    });

    console.log(`Found ${listings.length} listings without coordinates`);

    for (let listing of listings) {
        try {
            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: `${listing.location}, ${listing.country}`,
                    format: 'json',
                    limit: 1
                },
                headers: { 'User-Agent': 'Wanderlust-App' }
            });

            if (res.data && res.data[0]) {
                listing.lat = parseFloat(res.data[0].lat);
                listing.lng = parseFloat(res.data[0].lon);
                await listing.save();
                console.log(`✅ Updated: ${listing.title} → ${listing.lat}, ${listing.lng}`);
            } else {
                console.log(`❌ No geocode result for: ${listing.title}`);
            }

            await new Promise(r => setTimeout(r, 1100));

        } catch (err) {
            console.log(`❌ Error on ${listing.title}:`, err.message);
        }
    }

    console.log('Done!');
    mongoose.connection.close();
}

main();