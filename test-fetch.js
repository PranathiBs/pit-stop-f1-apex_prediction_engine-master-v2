
const year = 2024;
const gp = 'Bahrain';
const temp = 25;
const rain = 0;
const PYTHON_BACKEND = 'http://127.0.0.1:8888';

async function testFetch() {
    const url = `${PYTHON_BACKEND}/predict/race/${year}/${encodeURIComponent(gp)}?temp=${temp}&rain=${rain}`;
    console.log(`Testing fetch to: ${url}`);
    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Success! Predictions: ${data.predictions.length}`);
    } catch (err) {
        console.error('Fetch Failed:', err);
    }
}

testFetch();
