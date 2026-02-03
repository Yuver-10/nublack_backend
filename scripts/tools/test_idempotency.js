async function run() {
  try {
    // Try multiple credentials to log in (adjust if your environment has different test users)
    const creds = [
      { email: 'cliente@demo.com', password: 'password123' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'admin@nublack.com', password: 'admin123' }
    ];

    let token = null;
    let loggedUser = null;
    for (const c of creds) {
      const res = await fetch('http://127.0.0.1:3001/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c)
      });
      const body = await res.json();
      if (res.ok && body && body.data && body.data.accessToken) {
        token = body.data.accessToken;
        loggedUser = c.email;
        console.log('Login successful with', c.email);
        break;
      }
    }

    if (!token) {
      console.error('No valid credentials found, please provide a test user. Tried:', creds.map(c => c.email));
      process.exit(1);
    }

    // Ensure a product exists: if we're admin we can create one; otherwise assume product id 1 exists
    let productId = 1;

    // Try to create a product if admin
    if (loggedUser && loggedUser.includes('@nublack.com')) {
      console.log('Creating a test product as admin...');
      const createRes = await fetch('http://127.0.0.1:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: 'Producto Test Idemp', precio: 10000, categoria_id: 1, descripcion: 'Test', genero: 'Unisex', tallas: [{ talla: 'M', stock: 5 }] })
      });
      const createBody = await createRes.json();
      if (createRes.ok && createBody && createBody.data && createBody.data.id) {
        productId = createBody.data.id;
        console.log('Created product id', productId);
      } else if (createRes.ok && createBody && createBody.data && createBody.data.id_producto) {
        productId = createBody.data.id_producto;
        console.log('Created product id (alt)', productId);
      } else {
        console.warn('Could not create product, will try to use product id 1. Response:', createBody);
      }

      // Attempt to ensure the product has stock for size M (update product)
      try {
        const updRes = await fetch(`http://127.0.0.1:3001/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ tallas: [{ talla: 'M', stock: 5 }], stock: 5 })
        });
        const updBody = await updRes.json();
        if (updRes.ok) console.log('Product updated to ensure stock for M'); else console.warn('Could not update product to set stock, response:', updBody);
      } catch (e) {
        console.warn('Update product failed', e.message);
      }

      // Fetch product to inspect tallas/stock
      try {
        const prodRes = await fetch(`http://127.0.0.1:3001/api/products/${productId}`);
        const prodBody = await prodRes.json();
        console.log('Product fetch:', JSON.stringify(prodBody, null, 2));
      } catch (e) {
        console.warn('Could not fetch product after update', e.message);
      }
    }

    const payload = {
      items: [{ id_producto: productId, nombre: 'Producto Test', cantidad: 1, talla: 'M', precio: 10000 }],
      personalInfo: { nombre: 'Test User', documento: '1234', telefono: '3000000000', email: 'test@example.com' },
      deliveryInfo: { direccion: 'Calle Falsa 123', referencia: 'Frente al parque' },
      paymentInfo: { metodo: 'contraEntrega' },
      totals: { subtotal: 10000, envio: 0, total: 10000 }
    };

    const idempotencyKey = `test-idemp-${Date.now()}`;

    const makeReq = () => fetch('http://127.0.0.1:3001/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload)
    }).then(async r => ({ status: r.status, body: await r.json() })).catch(e => ({ error: e }));

    const [res1, res2] = await Promise.all([makeReq(), makeReq()]);

    console.log('Request 1:', JSON.stringify(res1, null, 2));
    console.log('Request 2:', JSON.stringify(res2, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

run();
