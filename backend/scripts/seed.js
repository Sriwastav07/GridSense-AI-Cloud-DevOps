require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Substation = require('../models/Substation');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Pole = require('../models/Pole');
const Telemetry = require('../models/Telemetry');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

const SEED_DB_URI = process.env.MONGO_URI;

async function runSeed() {
  try {
    console.log('Connecting to database with URI:', SEED_DB_URI);
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(SEED_DB_URI);
    }
    console.log('Connected. Clearing collections...');
    await User.deleteMany({});
    await Substation.deleteMany({});
    await Feeder.deleteMany({});
    await Transformer.deleteMany({});
    await Pole.deleteMany({});
    await Telemetry.deleteMany({});
    await Incident.deleteMany({});
    await Alert.deleteMany({});

    console.log('Generating seed users...');
    const admin = new User({
      email: 'admin@gridsense.com',
      password: 'adminpassword',
      role: 'Admin',
      name: 'Jane Doe (Admin)'
    });
    const operator = new User({
      email: 'operator@gridsense.com',
      password: 'operatorpassword',
      role: 'Operator',
      name: 'John Smith (Operator)'
    });
    await admin.save();
    await operator.save();

    console.log('Generating 4 Substations...');
    const substations = [];
    const subNames = ['Metro Central', 'North Ridge', 'West Industrial', 'East Harbor'];
    const subCoords = [
      { lat: 40.7128, lng: -74.0060 }, // NYC Center
      { lat: 40.7589, lng: -73.9851 }, // Times Sq area
      { lat: 40.7061, lng: -74.0089 }, // Wall St area
      { lat: 40.7484, lng: -73.9857 }  // Empire State area
    ];

    for (let i = 0; i < 4; i++) {
      const sub = new Substation({
        substationId: `SUB-0${i + 1}`,
        name: `${subNames[i]} Substation`,
        coordinates: subCoords[i],
        capacityMW: 45 + i * 15,
        status: 'Power ON'
      });
      await sub.save();
      substations.push(sub);
    }

    console.log('Generating 31 Feeders...');
    const feeders = [];
    for (let i = 1; i <= 31; i++) {
      const subIndex = (i - 1) % 4;
      const feeder = new Feeder({
        feederId: `FDR-${100 + i}`,
        name: `Feeder Line ${100 + i}`,
        substationId: substations[subIndex].substationId,
        status: 'Power ON'
      });
      await feeder.save();
      feeders.push(feeder);
    }

    console.log('Generating 412 Transformers...');
    const transformers = [];
    for (let i = 1; i <= 412; i++) {
      const feederIndex = (i - 1) % 31;
      const feeder = feeders[feederIndex];
      const transformer = new Transformer({
        transformerId: `TX-${1000 + i}`,
        name: `Transformer Unit ${1000 + i}`,
        feederId: feeder.feederId,
        substationId: feeder.substationId,
        status: 'Power ON'
      });
      await transformer.save();
      transformers.push(transformer);
    }

    console.log('Generating 400 Poles with hierarchical paths...');
    const poles = [];
    for (let i = 1; i <= 400; i++) {
      // Connect each pole sequentially to a transformer and feeder
      const txIndex = (i - 1) % 412; // Wrap around to make sure each has a parent transformer
      const tx = transformers[txIndex];
      const seq = Math.floor((i - 1) / 412) + 1; // Sequence along this transformer's line

      // Compute offset coordinates around the parent substation
      const sub = substations.find(s => s.substationId === tx.substationId);
      const angle = (txIndex * 13 + i * 17) % 360;
      const radius = 0.005 + (seq * 0.003) + (txIndex % 10) * 0.001; // distribute outward
      const latOffset = radius * Math.cos((angle * Math.PI) / 180);
      const lngOffset = radius * Math.sin((angle * Math.PI) / 180);

      const pole = new Pole({
        poleId: `POL-${10000 + i}`,
        transformerId: tx.transformerId,
        feederId: tx.feederId,
        substationId: tx.substationId,
        coordinates: {
          lat: sub.coordinates.lat + latOffset,
          lng: sub.coordinates.lng + lngOffset
        },
        sequence: seq,
        status: 'Power ON',
        voltage: 240,
        battery: 100,
        lastSeen: new Date(),
        firmware: 'v1.4.2',
        signal: -50 - (i % 40)
      });
      await pole.save();
      poles.push(pole);
    }

    console.log('Generating thousands of telemetry events...');
    const telemetryEvents = [];
    // Generate events for the past 24 hours
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 2000; i++) {
      const poleIndex = i % 400;
      const p = poles[poleIndex];
      const eventTime = new Date(now - (i * (oneDay / 2000)));

      telemetryEvents.push({
        timestamp: eventTime,
        poleId: p.poleId,
        event: 'HEARTBEAT',
        battery: Math.max(20, 100 - (i % 15)),
        sequence: p.sequence,
        signal: p.signal,
        firmware: p.firmware,
        status: 'Power ON',
        voltage: 238 + (i % 5)
      });
    }

    await Telemetry.insertMany(telemetryEvents);

    console.log('Seeding process complete!');
    return { success: true };
  } catch (err) {
    console.error('Error seeding data:', err);
    throw err;
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seeding run completed from command line.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding run failed:', err);
      process.exit(1);
    });
}

module.exports = runSeed;
