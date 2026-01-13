async function reproduce() {
    try {
        console.log("Intentando login...");
        const loginRes = await fetch("http://127.0.0.1:3001/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@nublack.com", password: "admin123" })
        });
        
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error("Login fallido:", JSON.stringify(loginData, null, 2));
            process.exit(1);
        }
        
        const token = loginData.data.accessToken;
        console.log("Login exitoso. Token obtenido.");

        console.log("Intentando crear producto vía API...");
        const createRes = await fetch("http://127.0.0.1:3001/api/products", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre: "Producto API Test Debug Final 2",
                precio: 123456,
                categoria_id: 1,
                descripcion: "Test desc debug final 2",
                genero: "Unisex",
                tallas: [{ talla: "S", stock: 5 }]
            })
        });

        const createData = await createRes.json();
        console.log("Estado Respuesta API:", createRes.status);
        console.log("Cuerpo Respuesta API:", JSON.stringify(createData, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error en script de reproducción:", error.message);
        process.exit(1);
    }
}

reproduce();
