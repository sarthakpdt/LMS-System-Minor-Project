const mongoose = require("mongoose");

const lmsDB = mongoose.createConnection(process.env.MONGO_URI);

const accountsDB = mongoose.createConnection(
  process.env.ACCOUNTS_MONGO_URI,
  {
    dbName: "accounts"
  }
);

lmsDB.on('connected', () => {
  console.log('✅ LMS MongoDB Connected (lmsDB)');
});

lmsDB.on('error', (err) => {
  console.error(`❌ LMS MongoDB Connection Error: ${err.message}`);
});

accountsDB.on('connected', () => {
  console.log('✅ Accounts MongoDB Connected (accountsDB)');
});

accountsDB.on('error', (err) => {
  console.error(`❌ Accounts MongoDB Connection Error: ${err.message}`);
});

module.exports = {
  lmsDB,
  accountsDB,
  accountsConnection: accountsDB
};

