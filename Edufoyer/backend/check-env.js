import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('🔍 Checking .env file...');
console.log('📁 File path:', envPath);
console.log('📁 File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('\n📋 All lines in .env file:');
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (line.trim()) {
      if (line.includes('OPENAI') || line.includes('openai')) {
        console.log(`\n🔴 LINE ${lineNum} (OPENAI related):`, line);
        console.log('   - Has # comment:', line.trim().startsWith('#'));
        console.log('   - Has OPENAI_API_KEY:', line.includes('OPENAI_API_KEY'));
        console.log('   - Exact content:', JSON.stringify(line));
      } else {
        console.log(`   LINE ${lineNum}:`, line.substring(0, 50) + (line.length > 50 ? '...' : ''));
      }
    }
  });
  
  // Check specifically for OPENAI_API_KEY
  const openaiLines = lines.filter((line, index) => 
    line.includes('OPENAI_API_KEY') || line.toLowerCase().includes('openai')
  );
  
  console.log('\n\n🔍 OPENAI_API_KEY related lines:');
  if (openaiLines.length === 0) {
    console.log('❌ NO OPENAI_API_KEY line found in .env file!');
  } else {
    openaiLines.forEach((line, index) => {
      const lineNum = lines.indexOf(line) + 1;
      console.log(`\n📌 Found on LINE ${lineNum}:`);
      console.log('   Content:', JSON.stringify(line));
      console.log('   Is commented:', line.trim().startsWith('#'));
      console.log('   Has value:', line.includes('=') && line.split('=')[1]?.trim().length > 0);
    });
  }
} else {
  console.log('❌ .env file does not exist!');
}







