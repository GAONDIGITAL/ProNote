const mysql = require("mysql2");

let db;

try {
    db = mysql.createConnection({
        user : process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE,
        multipleStatements: true
    });
} catch (err) {
    console.error(err);
}

module.exports = db;