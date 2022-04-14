/** Database setup for BizTime. */

const { Client } = require("pg");

const DB_URI =
  process.env.NODE_ENV === "test"
    ? "postgresql://davidjeffers:1234@localhost:5432/biztime_test" // added davidjeffers:1234@localhost:5432
    : "postgresql://davidjeffers:1234@localhost:5432/biztime";

let db = new Client({
  connectionString: DB_URI,
});

db.connect();

module.exports = db;
