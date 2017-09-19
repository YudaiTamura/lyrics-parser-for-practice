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
server.on('request', function (request, response) {
    //console.log(request);
    //console.log(server);

    //MySQLからデータを取得
    var queryStatement =
        'SELECT singer.id, singer.name, song.title, song.lyric ' +
        'FROM song ' +
        'INNER JOIN singer_song ON singer_song.song_id = song.id ' +
        'INNER JOIN composer ON composer.id = song.composer_id ' +
        'INNER JOIN singer ON singer.id = singer_song.singer_id;';

    connection.query(queryStatement, function (err, rows) {
        if (err) {
            console.log('err: ' + err);
        }
        if (request.url == '/') {
            //ファイル読み込み
            var templateOfSongsList = fs.readFileSync('../tmpl/registered_song_display.ejs', 'utf8');

            //HTMLとMySQLから取ってきたデータをマージする
            var mergedHTML = ejs.render(templateOfSongsList, {
                title: '登録済み曲表示画面',
                boardList: rows
            });

            response.writeHead(200, {'Content-Type': 'text/html'});//htmlファイルだからhtml
            response.write(mergedHTML);
            response.end();
        } else if (request.url == '/registration') {
            var templateOfNewRegister = fs.readFileSync('../tmpl/register_new_song.html', 'utf8');
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(templateOfNewRegister);
            response.end();
        }

    });
});

server.listen(settings.port, settings.host);
