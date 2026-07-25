// init/index.js
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js"); // 👈 Must import User model

const MONGO_URI = process.env.ATLASDB_URL;

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to DB");
    await initDB();
  } catch (err) {
    console.error("❌ DB connection error:", err);
  } finally {
    mongoose.connection.close();
  }
}

const initDB = async () => {
  try {
    // 1. Find any existing registered user in your Atlas DB
    const defaultUser = await User.findOne({});

    if (!defaultUser) {
      console.error("❌ No users found in database! Please register a user on the website at /signup first.");
      return;
    }

    // 2. Clear old listings
    await Listing.deleteMany({});

    // 3. Map listings with the valid User ID
    const allListings = initData.data.map((obj) => ({
      ...obj,
      owner: defaultUser._id, // 👈 Dynamically attaches real User ID
    }));

    await Listing.insertMany(allListings);

    console.log(`🎉 Database seeded successfully with ${allListings.length} listings!`);
  } catch (err) {
    console.error("❌ Seed error:", err);
  }
};

main();