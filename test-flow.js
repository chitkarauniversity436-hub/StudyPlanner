const http = require('http');

const request = (path, method, body, token) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method,
      headers
    }, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(result || '{}') }));
    });
    
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
};

async function test() {
  try {
    console.log("1. Registering user...");
    const regRes = await request('/auth/register', 'POST', { name: 'Test', email: 'test@example.com', password: 'password' });
    console.log("Register Res:", regRes);
    
    let token = regRes.data.token;
    if (!token) {
      console.log("Failed to register, trying login...");
      const logRes = await request('/auth/login', 'POST', { email: 'test@example.com', password: 'password' });
      token = logRes.data.token;
      console.log("Login Res:", logRes);
    }
    
    console.log("2. Generating test...");
    const genRes = await request('/tests/generate', 'POST', { subject_name: 'Science' }, token);
    console.log("Generate Res:", genRes);
    
    console.log("3. Submitting test...");
    const subRes = await request('/tests/submit', 'POST', { subject_name: 'Science', score: 85 }, token);
    console.log("Submit Res:", subRes);
    
    console.log("4. Fetching weaknesses...");
    const weakRes = await request('/tests/weaknesses', 'GET', null, token);
    console.log("Weaknesses Res:", weakRes);
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
