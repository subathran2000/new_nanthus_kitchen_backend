export default () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "api",

  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT ?? "5432", 10),
    name: process.env.DATABASE_NAME || "nanthus_kitchen",
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD, // No default - must be set
  },

  jwt: {
    secret: process.env.JWT_SECRET, // No default - must be set
    expiration: process.env.JWT_EXPIRATION || "24h",
    refreshSecret: process.env.JWT_REFRESH_SECRET, // No default - must be set
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  },

  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || "New Nanthu's Kitchen",
    fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@nanthuskitchen.com",
  },

  frontend: {
    url: process.env.FRONTEND_URL,
  },

  backend: {
    url: process.env.BACKEND_URL,
  },

  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE ?? "1048576", 10),
    dest: process.env.UPLOAD_DEST || "./uploads",
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? "60000", 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
    loginTtl: parseInt(process.env.LOGIN_THROTTLE_TTL ?? "900000", 10),
    loginLimit: parseInt(process.env.LOGIN_THROTTLE_LIMIT ?? "5", 10),
  },

  restaurant: {
    name: process.env.RESTAURANT_NAME || "New Nanthu's Kitchen",
    timezone: process.env.RESTAURANT_TIMEZONE || "America/Toronto",
    addresses: {
      markham:
        process.env.RESTAURANT_ADDRESS_MARKHAM || "72-30 Karachi Dr, L3S 0B6",
      scarborough:
        process.env.RESTAURANT_ADDRESS_SCARBOROUGH || "80 Nashdene Rd, M1V 5E4",
    },
  },
});
