// backend/canvasTest.js
const { createCanvas } = require('canvas');
const fs = require('fs');

// Create a 200x200 canvas
const width = 200;
const height = 200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#4caf50';
ctx.fillRect(0, 0, width, height);

// Draw some text
ctx.fillStyle = '#fff';
ctx.font = '30px Sans';
ctx.fillText('Test', 50, 100);

// Export to PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test.png', buffer);

console.log('Canvas test completed. Check test.png in backend folder.');
