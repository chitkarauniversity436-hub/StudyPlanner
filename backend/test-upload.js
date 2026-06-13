const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // 1. Create a dummy PDF file
    const dummyPath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(dummyPath, '%PDF-1.4\n1 0 obj\n<<\n/Title (Dummy PDF)\n>>\nendobj\n%%EOF');

    // 2. Login to get a token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    
    if (!token) {
      console.log('Login failed');
      return;
    }

    // 3. Upload syllabus
    const form = new FormData();
    form.append('subject_name', 'Test Subject');
    form.append('syllabus', fs.createReadStream(dummyPath));

    const uploadRes = await axios.post('http://localhost:5000/api/syllabus/upload', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Upload success:', uploadRes.data);

    // Clean up
    fs.unlinkSync(dummyPath);
  } catch (error) {
    console.error('Upload failed:', error.response ? error.response.data : error.message);
  }
}

testUpload();
