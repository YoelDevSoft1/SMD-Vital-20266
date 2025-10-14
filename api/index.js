// Vercel serverless function entry point
const { createServer } = require('../smd-vital-backend/dist/index.js');

module.exports = createServer();
