//httpモジュールの読み込み(インポート)
var http = require('http');
var fs = require('fs');
//ejsオブジェクトの読み込み
var ejs = require('ejs');
//MySQLオブジェクトの読み込み
const mysql = require('mysql');


//サーバーを立てる
var server = http.createServer();
//ホストとポートの設定のインポート
var settings = require('./settings');


//MySQLとのコネクション確立
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'lyrics_database'
});

//MySQL接続
connection.connect();
console.log(settings);


//サーバーの起動
server.on('request', function (req, res) {
    //MySQLからデータを取得
    var queryStatement = 'SELECT id, title, singer, lyric FROM lyrics';
    connection.query(queryStatement, function (err, rows) {
        if (err) {
            console.log('err: ' + err);
        }

        //ファイル読み込み
        var template = fs.readFileSync('../tmpl/registered_song_display.ejs', 'utf8');
        var mergedHTML = ejs.render(template, {
            title: '登録済み曲表示画面',
            boardList: [rows[0].id, rows[0].title, rows[0].singer, rows[0].lyric]
        });

        console.log(rows[0].id, rows[0].title, rows[0].singer, rows[0].lyric);

        res.writeHead(200, {'Content-Type': 'text/html'});//htmlファイルだからhtml
        res.write(mergedHTML);
        res.end();
    });
});

server.listen(settings.port, settings.host);
