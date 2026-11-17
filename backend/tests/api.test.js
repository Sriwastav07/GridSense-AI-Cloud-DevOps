const request = require('supertest');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Set Node Environment to test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { app } = require('../server');
const User = require('../models/User');
const Substation = require('../models/Substation');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Pole = require('../models/Pole');
const Incident = require('../models/Incident');

describe('GridSense AI API Endpoints Integration Tests', () => {
  let mongoServer;
  let token;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Create a seed operator
    const op = new User({
      email: 'operator@gridsense.com',
      password: 'operatorpassword',
      role: 'Operator',
      name: 'John Smith (Operator)'
    });
    await op.save();

    // Generate JWT token
    token = jwt.sign(
      { email: op.email, role: op.role, name: op.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate demo administrator credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gridsense.com', password: 'adminpassword' });

      assert.equal(res.status, 200);
      assert.ok(Object.hasOwn(res.body, 'token'));
      assert.equal(res.body.user.role, 'Admin');
    });

    it('should block incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'operator@gridsense.com', password: 'wrongpassword' });

      assert.equal(res.status, 401);
    });
  });

  describe('Protected endpoints authentication verification', () => {
    it('should block requests lacking an auth header', async () => {
      const res = await request(app).get('/api/dashboard');
      assert.equal(res.status, 401);
    });
  });

  describe('GET /api/dashboard', () => {
    it('should retrieve core KPI counters and chart distributions', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.ok(Object.hasOwn(res.body, 'kpis'));
      assert.ok(Object.hasOwn(res.body.kpis, 'totalSubstations'));
      assert.ok(Object.hasOwn(res.body, 'charts'));
    });
  });

  describe('GET /api/map', () => {
    it('should return grid layouts and coordinates', async () => {
      const res = await request(app)
        .get('/api/map')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.ok(Object.hasOwn(res.body, 'substations'));
      assert.ok(Object.hasOwn(res.body, 'poles'));
    });
  });
});
