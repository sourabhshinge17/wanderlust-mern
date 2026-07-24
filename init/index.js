const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URI = 'mongodb://127.0.0.1:27017/wanderlust';

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
    await Listing.deleteMany({});

    const allListings = initData.data.map((obj) => ({
      ...obj,
      owner: new mongoose.Types.ObjectId("6a58579c55051f41275daf4e"),
    }));

    await Listing.insertMany(allListings);

    console.log("🎉 Database seeded successfully with 29 listings!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  }
};

main();