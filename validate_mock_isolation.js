const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Permitir pasar teléfono y contraseña por argumentos de línea de comando
const phone = process.argv[2] || '+525512345678';
const password = process.argv[3] || 'password123';

async function executeRealValidation() {
  console.log('================================================================');
  console.log('INICIANDO FLUJO DE VALIDACIÓN EN API REAL (SIN MOCKS)');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Usuario: ${phone}`);
  console.log('================================================================\n');

  let token;
  let activeOrgId1;
  let activeOrgId2;

  // --- 1. Autenticación: POST /api/v1/auth/login ---
  console.log('Paso 1: Iniciando sesión (POST /auth/login)...');
  try {
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      phone: phone,
      password: password
    });
    
    // De acuerdo a Auth.LoginResponse el token viene como accessToken
    token = loginRes.data.accessToken || loginRes.data.access_token;
    if (!token) {
      console.error('Error: No se recibió un token en la respuesta de login.');
      console.log('Respuesta recibida:', loginRes.data);
      return;
    }
    console.log(`¡Inicio de sesión exitoso! Token obtenido (primeros 30 caracteres): Bearer ${token.substring(0, 30)}...\n`);
  } catch (err) {
    console.error('Error al iniciar sesión (POST /auth/login):');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    console.log('\n[INFO] Asegúrate de que el servidor backend esté corriendo en 127.0.0.1:8000.');
    return;
  }

  // Configurar las cabeceras por defecto para las siguientes peticiones
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // --- 2. Contexto de Usuario Activo: GET /api/v1/me ---
  console.log('Paso 2: Obtener contexto del usuario activo (GET /me)...');
  try {
    const meRes = await axios.get(`${API_BASE_URL}/me`, { headers });
    console.log('Respuesta de /me:');
    console.log(JSON.stringify(meRes.data, null, 2));
    console.log('\n');
  } catch (err) {
    console.error('Error al obtener contexto (GET /me):');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    console.log('\n');
  }

  // --- 3. Listar Organizaciones del Usuario: GET /api/v1/organizations ---
  console.log('Paso 3: Listando organizaciones (GET /organizations)...');
  try {
    const orgsRes = await axios.get(`${API_BASE_URL}/organizations`, { headers });
    const orgList = orgsRes.data.organizations || [];
    console.log(`Organizaciones encontradas: ${orgList.length}`);
    console.log(JSON.stringify(orgsRes.data, null, 2));
    console.log('\n');

    if (orgList.length > 0) {
      activeOrgId1 = orgList[0].id;
    }
    if (orgList.length > 1) {
      activeOrgId2 = orgList[1].id;
    } else {
      // Si el usuario solo tiene una org, usaremos una simulada/vacía para la validación
      activeOrgId2 = 'org_vacia_test_99999999-9999-9999-9999-999999999999';
    }
  } catch (err) {
    console.error('Error al obtener organizaciones (GET /organizations):');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    return;
  }

  // --- PETICIÓN A: GET /api/v1/organizations/{org_id_1}/production-units ---
  console.log('----------------------------------------------------------------');
  console.log(`Petición A: GET /organizations/${activeOrgId1}/production-units`);
  console.log('----------------------------------------------------------------');
  try {
    const resA = await axios.get(`${API_BASE_URL}/organizations/${activeOrgId1}/production-units`, { headers });
    console.log(`Respuesta A (Status: ${resA.status}):`);
    console.log(JSON.stringify(resA.data, null, 2));
  } catch (err) {
    console.error('Error en Petición A:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
  console.log('\n');

  // --- PETICIÓN B: GET /api/v1/organizations/{org_id_2}/production-units ---
  console.log('----------------------------------------------------------------');
  console.log(`Petición B: GET /organizations/${activeOrgId2}/production-units`);
  console.log('----------------------------------------------------------------');
  try {
    const resB = await axios.get(`${API_BASE_URL}/organizations/${activeOrgId2}/production-units`, { headers });
    console.log(`Respuesta B (Status: ${resB.status}):`);
    console.log(JSON.stringify(resB.data, null, 2));
  } catch (err) {
    console.error('Error/Resultado en Petición B:');
    if (err.response) {
      console.log(`Status: ${err.response.status} (Esperado si la organización es de prueba)`);
      console.log(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
  console.log('\n');

  // --- PETICIÓN C: GET /api/v1/organizations/{org_sin_acceso}/production-units (Esperando 403) ---
  const orgSinAcceso = 'org_sin_acceso_00000000-0000-0000-0000-000000000000';
  console.log('----------------------------------------------------------------');
  console.log(`Petición C: GET /organizations/${orgSinAcceso}/production-units`);
  console.log('----------------------------------------------------------------');
  try {
    const resC = await axios.get(`${API_BASE_URL}/organizations/${orgSinAcceso}/production-units`, { headers });
    console.log('Error: La petición debió fallar con 403 Forbidden pero fue exitosa.');
    console.log(JSON.stringify(resC.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log(`Fallo Esperado Correctamente (Status: ${err.response.status} ${err.response.statusText}):`);
      console.log(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error de conexión:', err.message);
    }
  }
  console.log('\n');

  // --- PETICIÓN ADICIONAL: GET /api/v1/organizations/{org_id}/permissions/me ---
  console.log('----------------------------------------------------------------');
  console.log(`Petición Adicional: GET /organizations/${activeOrgId1}/permissions/me`);
  console.log('----------------------------------------------------------------');
  try {
    const resPerms = await axios.get(`${API_BASE_URL}/organizations/${activeOrgId1}/permissions/me`, { headers });
    console.log(`Respuesta Permisos (Status: ${resPerms.status}):`);
    console.log(JSON.stringify(resPerms.data, null, 2));
  } catch (err) {
    console.error('Error al obtener permisos:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
  console.log('\n================================================================');
  console.log('FIN DE LA SECUENCIA DE VALIDACIÓN EN API REAL');
  console.log('================================================================');
}

executeRealValidation();
