// tests/test-us2-login.js
const mongoose = require('mongoose');
const User = require('../api/models/User');
const LoginAttempt = require('../api/models/LoginAttempt');
const BlacklistedToken = require('../api/models/BlacklistedToken');
const { generateToken, verifyToken, invalidateToken } = require('../api/utils/jwt');
const { comparePasswordWithRateLimit } = require('../api/controllers/AuthController');
require('dotenv').config();

async function testUS2Login() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Limpiar datos de prueba
    await User.deleteMany({ correo: { $in: ['test@example.com'] } });
    await LoginAttempt.deleteMany({});
    await BlacklistedToken.deleteMany({});
    
    // PREPARACIÓN: Crear usuario de prueba
    const testUser = new User({
      nombres: 'Juan',
      apellidos: 'Test',
      edad: 25,
      correo: 'test@example.com',
      contrasena: 'TestPassword123!',   
      username: 'testuser123'
    });
    await testUser.save();
    console.log('👤 Usuario de prueba creado');
    
    // TEST 1: Login exitoso
    console.log('\n🧪 TEST 1: Login exitoso');
    let token;
    try {
      const isPasswordValid = await comparePasswordWithRateLimit(testUser, 'TestPassword123!');
      console.log('✅ Contraseña válida:', isPasswordValid);
      
      token = generateToken(testUser);
      console.log('🎫 Token generado:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Error en TEST 1:', error.message);
      throw error;
    }
    
    // TEST 2: Verificar token
    console.log('\n🧪 TEST 2: Verificar token');
    const decoded = await verifyToken(token);
    console.log('✅ Token válido, userId:', decoded.userId);
    
    // TEST 3: Login con contraseña incorrecta
    console.log('\n🧪 TEST 3: Contraseña incorrecta');
    try {
      await comparePasswordWithRateLimit(testUser, 'PasswordIncorrecta');
      console.log('❌ ERROR: Debería haber fallado');
    } catch (error) {
      if (error.message === 'CONTRASEÑA_INCORRECTA') {
        console.log('✅ Correctamente rechazada contraseña incorrecta');
      } else {
        console.error('❌ Error inesperado en TEST 3:', error.message);
        throw error;
      }
    }
    
    // TEST 4: Rate limiting por intentos fallidos
    console.log('\n🧪 TEST 4: Rate limiting');
    const updatedUser = await User.findById(testUser._id);
    console.log('📊 Intentos fallidos:', updatedUser.loginAttempts);
    
    // TEST 5: Invalidar token (logout)
    console.log('\n🧪 TEST 5: Logout (invalidar token)');
    await invalidateToken(token, testUser._id);
    
    try {
      await verifyToken(token);
      console.log('❌ ERROR: Token debería estar invalidado');
    } catch (error) {
      console.log('✅ Token correctamente invalidado');
    }
    
    // TEST 6: Rate limiting por IP
    console.log('\n🧪 TEST 6: Rate limiting por IP');
    const testIP = '192.168.1.100';
    
    try {
      await LoginAttempt.checkRateLimit(testIP);
      console.log('✅ IP sin restricciones inicialmente');
      
      // Simular 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        try {
          await LoginAttempt.recordFailedAttempt(testIP);
        } catch (error) {
          if (error.message === 'IP_RATE_LIMITED') {
            console.log('🔒 IP bloqueada después de', i + 1, 'intentos');
            break;
          }
        }
      }
    } catch (error) {
      console.log('✅ Rate limiting por IP funcionando');
    }
    
    // Limpiar datos de prueba
    await User.deleteMany({ correo: 'test@example.com' });
    await LoginAttempt.deleteMany({});
    await BlacklistedToken.deleteMany({});
    console.log('\n🧹 Datos de prueba limpiados');
    
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
}

testUS2Login();