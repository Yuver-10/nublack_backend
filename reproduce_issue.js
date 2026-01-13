
const API_URL = 'http://localhost:3001/api';

async function reproduce() {
    try {
        console.log('1. Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@nublack.com',
                password: 'admin123'
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));

        // CORRECT EXTRACTION
        const token = loginData.data.accessToken;
        console.log('Login successful. Token obtained:', token ? 'Yes' : 'No');

        if (!token) {
            console.error('Login response structure:', JSON.stringify(loginData, null, 2));
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('\n2. Testing /api/orders/all ...');
        try {
            const ordersRes = await fetch(`${API_URL}/orders/all`, { headers });
            const ordersData = await ordersRes.json();
            console.log('Orders response status:', ordersRes.status);
            if (!ordersRes.ok) console.error('Orders error:', ordersData);
        } catch (error) {
            console.error('Orders failed:', error.message);
        }

        console.log('\n3. Testing /api/categories (GET) ...');
        try {
            const catsRes = await fetch(`${API_URL}/categories`, { headers });
            const catsData = await catsRes.json();
            console.log('Categories response status:', catsRes.status);

            if (catsRes.ok && catsData.length > 0) {
                const id = catsData[0].id_categoria;
                console.log(`\n4. Testing /api/categories/${id} (PUT update)...`);
                try {
                    const updateRes = await fetch(`${API_URL}/categories/${id}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            nombre: catsData[0].nombre, // Same name
                            descripcion: catsData[0].descripcion
                        })
                    });
                    const updateData = await updateRes.json();
                    console.log('Category update status:', updateRes.status);
                    if (!updateRes.ok) console.error('Category update error:', updateData);
                } catch (error) {
                    console.error('Category update failed:', error.message);
                }
            }
        } catch (error) {
            console.error('Categories GET failed:', error.message);
        }

    } catch (error) {
        console.error('Login failed:', error.message);
    }
}

reproduce();
