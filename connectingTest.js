// requireの設定
const mysql = require('mysql');

// MySQLとのコネクションの作成
const connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    database: 'testdatabase'
});

// 接続
connection.connect();

// userdataの取得
connection.query('SELECT * from userdata;', function (err, rows, fields) {
    if (err) { console.log('err: ' + err); }

    console.log('name: ' + rows[0].name);
    console.log('id: ' + rows[0].id);

});

// userdataのカラムを取得
connection.query('SHOW COLUMNS FROM userdata;', function (err, rows, fields) {
    if (err) { console.log('err: ' + err); }

    console.log(rows[0].Field);
    console.log(rows[1].Field);
});

// 接続終了
connection.end();