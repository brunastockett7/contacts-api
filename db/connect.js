// db/connect.js
const { MongoClient } = require('mongodb');

let _db;

const initDb = async (callback) => {
  if (_db) return callback(null, _db);

  const uri = process.env.CONNECTION_STRING;
  if (!uri) return callback(new Error('Missing CONNECTION_STRING in .env'));

  try {
    const client = new MongoClient(uri);
    await client.connect();
    _db = client.db('contactsDB'); // your DB name
    console.log('✅ Database initialized successfully');
    callback(null, _db);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    callback(err);
  }
};

const getDb = () => {
  if (!_db) throw Error('Database not initialized');
  return _db;
};

module.exports = { initDb, getDb };
