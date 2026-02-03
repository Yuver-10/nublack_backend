// No import needed for native fetch in Node 18+

async function testApi() {
    try {
        console.log('Fetching /api/users from port 3001...');
        // We try the one that the frontend is actually using
        const response = await fetch('http://localhost:3001/api/users');
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('FETCH ERROR:');
        console.error(error);
    }
}

testApi();
