const mongoose = require("mongoose");
const { execSync } = require("child_process");

const mongoUri = process.env.MONGO_URI;
let accountsUri = process.env.ACCOUNTS_MONGO_URI || mongoUri;

// Check connectivity to ACCOUNTS_MONGO_URI before binding
if (process.env.ACCOUNTS_MONGO_URI && process.env.ACCOUNTS_MONGO_URI !== mongoUri) {
  try {
    console.log("Checking Accounts database connectivity...");
    // Run a brief standalone check to verify connection and authentication status
    const testCmd = `
      const mongoose = require("mongoose");
      mongoose.connect("${process.env.ACCOUNTS_MONGO_URI}", { serverSelectionTimeoutMS: 2000 })
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      setTimeout(() => process.exit(1), 2500);
    `;
    execSync(`node -e "${testCmd.replace(/\n/g, "")}"`, { stdio: "ignore", timeout: 3000 });
    console.log("✅ Accounts database is reachable and authenticated.");
  } catch (err) {
    console.warn("⚠️ Accounts database is unreachable or access is blocked. Falling back to LMS primary database.");
    accountsUri = mongoUri;
  }
}

const lmsDB = mongoose.createConnection(mongoUri);

const accountsDB = mongoose.createConnection(
  accountsUri,
  accountsUri === mongoUri ? {} : { dbName: "accounts" }
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

