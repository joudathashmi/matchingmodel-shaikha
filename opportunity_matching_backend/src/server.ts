// src\server.ts
import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;
// Bind to all interfaces to work in Docker
app.listen(PORT as number, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});