const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('c:/WokManeja/WokManeja/database.sqlite');
db.all("SELECT * FROM docs WHERE collection = 'users'", (err, rows) => {
    if (err) throw err;
    console.log(JSON.stringify(rows.map(r => JSON.parse(r.data)), null, 2));
});
