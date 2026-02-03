async function testLogin() {
    try {
        console.log('Intentando login en Render...\n');
        
        const response = await fetch(
            'https://apinublack-119d7438bfb7.herokuapp.app/api/auth/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'admin@demo.local.com',
                    password: 'admin1234'
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('✅ LOGIN EXITOSO');
            console.log('\nRespuesta:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error('❌ ERROR EN LOGIN');
            console.error('\nEstatus:', response.status);
            console.error('Respuesta:');
            console.error(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN');
        console.error('Error:', error.message);
    }
}

testLogin();
