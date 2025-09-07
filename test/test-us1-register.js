const mongoose = require('mongoose');
const User = require('../api/models/User');
require('dotenv').config();

async function testUS1Registration() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Limpiar datos de prueba anteriores
    await User.deleteOne({ correo: 'test@example.com' });
    
    // CASO DE PRUEBA 1: Registro exitoso
    console.log('\n🧪 CASO 1: Registro exitoso');
    const testUser = new User({
      nombres: 'Juan',
      apellidos: 'Pérez',
      edad: 25,
      correo: 'test@example.com',
      contrasena: 'MiPassword123!',
      username: 'juanperez123'
    });
    
    const savedUser = await testUser.save();
    console.log('✅ Usuario creado exitosamente');
    console.log('📧 Email:', savedUser.correo);
    console.log('🆔 ID:', savedUser._id);
    console.log('📅 Creado:', savedUser.createdAt);
    console.log('🔒 Password hasheada:', savedUser.contrasena.substring(0, 20) + '...');
    
    // Verificar que la contraseña fue hasheada
    const isPasswordHashed = savedUser.contrasena !== 'MiPassword123!';
    console.log('🔐 Password correctamente hasheada:', isPasswordHashed ? '✅' : '❌');
    
    // CASO DE PRUEBA 2: Email duplicado
    console.log('\n🧪 CASO 2: Email duplicado');
    try {
      const duplicateUser = new User({
        nombres: 'María',
        apellidos: 'García',
        edad: 30,
        correo: 'test@example.com', // Mismo email
        contrasena: 'OtraPassword123!',
        username: 'mariagarcia123'
      });
      await duplicateUser.save();
      console.log('❌ ERROR: Debería haber fallado por email duplicado');
    } catch (error) {
      console.log('✅ Correctamente rechazado email duplicado');
    }
    
    // CASO DE PRUEBA 3: Validaciones
    console.log('\n🧪 CASO 3: Validaciones');
    try {
      const invalidUser = new User({
        nombres: 'A', // Muy corto
        apellidos: '', // Vacío
        edad: 12, // Menor a 13
        correo: 'email-invalido', // Formato inválido
        contrasena: '123', // Muy simple
        username: 'us'
      });
      await invalidUser.save();
      console.log('❌ ERROR: Debería haber fallado por validaciones');
    } catch (error) {
      console.log('✅ Validaciones funcionando correctamente');
      console.log('📝 Errores encontrados:', Object.keys(error.errors).length);
    }
    
    // Limpiar datos de prueba
    //await User.deleteOne({ correo: 'test@example.com' });
    //console.log('\n🧹 Datos de prueba limpiados');
    
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
}

testUS1Registration();