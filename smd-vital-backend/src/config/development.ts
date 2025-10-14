// Development configuration - temporary
export const devConfig = {
  database: {
    url: "postgresql://username:password@localhost:5432/smd_vital_db"
  },
  redis: {
    url: "redis://localhost:6379"
  },
  jwt: {
    secret: "dev-jwt-secret-key",
    expiresIn: "24h",
    refreshSecret: "dev-refresh-secret-key",
    refreshExpiresIn: "7d"
  },
  port: 3000,
  nodeEnv: "development",
  cors: {
    origin: "http://localhost:4322",
    credentials: true
  },
  rateLimit: {
    windowMs: 900000,
    maxRequests: 100
  },
  security: {
    bcryptRounds: 12,
    sessionSecret: "dev-session-secret"
  },
  logging: {
    level: "info",
    file: "logs/app.log"
  }
};




