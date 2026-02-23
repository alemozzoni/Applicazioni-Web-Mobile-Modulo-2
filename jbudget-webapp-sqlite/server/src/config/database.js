require('dotenv').config();

const common = {
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};

function pgConfig() {
  return {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'jbudget',
    username: process.env.DB_USER || 'jbudget',
    password: process.env.DB_PASS || 'jbudget',
    dialectOptions: process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
    ...common
  };
}

module.exports = {
  development: pgConfig(),
  test: {
    // Keep tests simple & fast
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: pgConfig()
};
