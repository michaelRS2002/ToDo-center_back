const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../api/index');
const User = require('../api/models/User');

// Test user data
const testUser = {
  nombres: 'Test',
  apellidos: 'User',
  edad: 25,
  correo: 'test@example.com',
  contrasena: 'Test123!',
  username: 'testuser'
};

describe('API Routes', () => {
  // Connect to the database before running tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    // Clear the test database
    await User.deleteMany({});
  });

  // Close database connection after all tests are done
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Clean up after each test
  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
      expect(response.body).toHaveProperty('userId');
    });

    it('should not register a user with an existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: 'anotherusername'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      // Check for specific validation errors
      expect(response.body.errors.some(e => e.msg === 'El nombre es obligatorio')).toBe(true);
      expect(response.body.errors.some(e => e.msg === 'El correo es obligatorio')).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: testUser.correo,
          contrasena: testUser.contrasena
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('correo', testUser.correo);
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: testUser.correo,
          contrasena: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'nonexistent@example.com',
          contrasena: 'anypassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /', () => {
    it('should return server status', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.text).toBe('Server is running');
    });
  });
});
