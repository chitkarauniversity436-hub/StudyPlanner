require('dotenv').config();
const axios = require('axios');
const pdfParse = require('pdf-parse');

async function testUpload() {
  const response = await axios({
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    method: 'GET',
    responseType: 'arraybuffer'
  });

  try {
    const dataBuffer = Buffer.from(response.data);
    const data = await pdfParse(dataBuffer);
    console.log("PDF Parsed successfully. Text:", data.text);
  } catch (error) {
    console.error("PDF Parse error:", error);
  }
}
testUpload();
