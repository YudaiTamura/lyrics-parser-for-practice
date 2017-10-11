// httpモジュールの読み込み(インポート)
var http = require('http');
var fs = require('fs');
// ejsオブジェクトの読み込み
var ejs = require('ejs');
// MySQLオブジェクトの読み込み
const mysql = require('mysql');

// HTMLのフォームから渡ってくるようなデータをパースするとき使うモジュール
var querystring = require('querystring');

// サーバーを立てる
var server = http.createServer();
// ホストとポートの設定のインポート
var settings = require('./settings');

// MySQLとのコネクション確立
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'lyrics_database'
});

//MySQL接続
connection.connect();


// セッションidがキー、セッションのボディがバリューとなるハッシュsessionsを作成
var sessions = {};
// Sessionクラス
var Session = (function () {
    // コンストラクタ
    var hoge = function (request, response) {
        this.request = request;
        this.response = response;
    };

    // getメソッド
    hoge.prototype.get = function (bodyKey) {
        var sessionKey = this.request.headers.cookie;
        sessionKey = querystring.parse(sessionKey, ";");
        sessionKey = sessionKey["sessionId"];
        //console.log(sessionKey);
        if (!sessionKey) {
            return {"title": "", "singerName": "", "mp3file": ""};
        }
        var sessionBody = sessions[sessionKey];
        return sessionBody[bodyKey];
    };

    // setメソッド
    hoge.prototype.set = function (bodyKey, bodyValue) {
        var body = {};
        body[bodyKey] = bodyValue;

        //セッションidの発行
        var sessionId = Math.random();
        //bodyをセッションIDをキーとしてbodyをsessionsにいれる。これでセッションは完成。
        sessions[sessionId] = body;
        //最後にセッションidをクッキーにセットする
        this.response.setHeader("Set-Cookie", ["sessionId" = sessionId]);
        return;
    };

    // deleteメソッド
    hoge.prototype.delete = function (bodyKey) {

        return;
    };

    return hoge;
})();


//サーバーの起動
server.on('request', function (request, response) {
    ///// topページの時 /////
    if (request.url === '/') {
        // MySQLからデータを取得するためのクエリ
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
            //ファイル読み込み
            var templateOfSongsList = fs.readFileSync('../tmpl/registered_song_display.ejs', 'utf8');
            //HTMLとMySQLから取ってきたデータをマージする
            var html = ejs.render(templateOfSongsList, {
                boardList: rows
            });
            response.writeHead(200, {'Content-Type': 'text/html'});//htmlファイルだからhtml
            response.write(html);
            response.end();
        });


        ///// 新規登録画面の時 /////
    } else if (request.url === '/registration/') {
        var templateOfNewRegister = fs.readFileSync('../tmpl/register_new_song.ejs', 'utf8');

        //sessionオブジェクト生成
        var session = new Session(request, response);
        // セッションから入力データとエラーを取ってくる
        var inputs = session.get("inputs");
        var errors = session.get("errors");

        var html = ejs.render(templateOfNewRegister, {
            inputtedTextMap: inputs,
            errors: errors
        });

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(html);
        response.end();


        ///// 新規登録ボタンを押した時の処理 /////
    } else if (request.url === "/registration/post") {
        var dataFromInputForms = '';
        // readableイベントが発火したらデータにリクエストボディのデータを追加
        request.on('readable', function () {
            dataFromInputForms += request.read();
        });
        // リクエストボディをすべて読み込んだらendイベントが発火する。
        request.on('end', function () {
            // パースしてinputsを作る
            var inputs = querystring.parse(dataFromInputForms);
            // 必須のデータはどれか指定する
            var dataRule = {
                title: ["not_blank", "ascii"],
                singerName: ["not_blank", "ascii"],
                mp3file: ["not_blank", "file"]
            }


            // セッションのbodyの中のerrorの設定
            var errors = {};
            Object.keys(dataRule).forEach(function (dataName) {
                var rule = dataRule[dataName];
                var value = inputs[dataName];
                for (var i = 0, arrayLength = rule.length; i < arrayLength; i++) { //実際のところ２回ループ
                    var row = rule[i];
                    if (row == "not_blank") {
                        if (value == "") {
                            errors[dataName].push("blank!(error message)")
                        }
                    }
                    if (row == "ascii") {
                        if (value.match(/a-zA-Z/)) {
                            errors[dataName].push("not ascii input!(error message)")
                        }
                    }
                }
            });

            var session = new Session(request, response);
            if (Object.keys(errors).length > 0) {
                // exists error
                session.set("inputs", inputs);
                session.set("errors", errors);

                response.redirect("/registration/");
                response.end();
            } else {
                // insert して
                session.delete("inputs");
                session.delete("errors");

                response.redirect("/");
                response.end();
            }


            /* 歌手名と曲名の組み合わせがDBにないかチェックする。*/
            // 組み合わせがある時はホーム画面に戻り、ハイライトしておく（とりあえず後で）
            // 組み合わせがない時はウェブサイト(Uta-Net)から検索

            //response.end("Now Searching");

        });
    }
});


server.listen(settings.port, settings.host);
