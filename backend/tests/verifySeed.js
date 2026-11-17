const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Pole = require('../models/Pole');
const Substation = require('../models/Substation');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Telemetry = require('../models/Telemetry');

async function testSeed() {
  let mongoServer;
  try {
    console.log('Starting MongoMemoryServer for seed testing...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    process.env.MONGO_URI = uri;
    console.log('Seeding against memory database at URI:', uri);

    // Require runSeed inside so it loads MONGO_URI from env correctly
    const runSeed = require('../scripts/seed');
    await runSeed();

    // Verify seed data counts
    const usersCount = await User.countDocuments();
    const substationsCount = await Substation.countDocuments();
    const feedersCount = await Feeder.countDocuments();
    const transformersCount = await Transformer.countDocuments();
    const polesCount = await Pole.countDocuments();
    const telemetryCount = await Telemetry.countDocuments();

    console.log(`Verification Results:
      Users: ${usersCount} (Expected: 2)
      Substations: ${substationsCount} (Expected: 4)
      Feeders: ${feedersCount} (Expected: 31)
      Transformers: ${transformersCount} (Expected: 412)
      Poles: ${polesCount} (Expected: 400)
      Telemetry: ${telemetryCount} (Expected: 2000)
    `);

    if (usersCount === 2 && substationsCount === 4 && feedersCount === 31 && transformersCount === 412 && polesCount === 400 && telemetryCount === 2000) {
      console.log('SEED SCRIPT TESTING PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('SEED SCRIPT TESTING FAILED: Counts did not match expected values.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during seed testing:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

testSeed();
