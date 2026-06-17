const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\Deepak\\.gemini\\antigravity-ide\\brain\\8f34cf56-e19f-490b-9027-dfcceaf0f320\\.system_generated\\logs\\transcript.jsonl";

const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.step_index >= 220) {
      console.log(`STEP ${data.step_index}: source=${data.source}, type=${data.type}, status=${data.status}, content_preview=${(data.content || '').substring(0, 100).replace(/\n/g, ' ')}`);
    }
  } catch (e) {
  }
});
