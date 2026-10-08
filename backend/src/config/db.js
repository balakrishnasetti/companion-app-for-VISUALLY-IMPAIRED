const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured before starting the API.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  return mongoose.connection;
}

module.exports = connectDatabase;
