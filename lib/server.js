// httpモジュールの読み込み(インポート)
var http = require("http");
var fs = require("fs");
// ejsオブジェクトの読み込み
var ejs = require("ejs");
// MySQLオブジェクトの読み込み
const mysql = require("mysql");

// HTMLのフォームから渡ってくるようなデータをパースするとき使うモジュール
var querystring = require("querystring");
// 文字コードの判定に用いるモジュール
var jschardet = require('jschardet');

// サーバーを立てる
var server = http.createServer();
// ホストとポートの設定のインポート
var settings = require("./settings");

// MySQLとのコネクション確立
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "lyrics_database"
});

//MySQL接続
connection.connect();


// セッションidがキー、セッションのボディがバリューとなるハッシュsessionsを作成
var sessions = {};
// Sessionクラス
var Session = (function () {
    // コンストラクタ
    var hoge = function (request, response) {
        // クッキーの中身から必要な部分だけをsessionIdとして取り出す
        var cookie = request.headers.cookie;
        var parsedCookie = querystring.parse(cookie, ";");
        var sessionId = parsedCookie["sessionId"];
        //クッキーまたはセッションの中身が空の時は、セッションidを発行して、そのIDをキーとするハッシュを作る
        if (!sessionId || !sessions[sessionId]) {
            sessionId = Math.random();
            sessions[sessionId] = {};
        }
        //セッションidをクッキーにセットする
        response.setHeader("Set-Cookie", ["sessionId =" + sessionId]);

        this.sessionBody = sessions[sessionId];
    };


    // getメソッド
    hoge.prototype.get = function (bodyKey) {
        // "inputs"や"errors"のバリューを返す
        return this.sessionBody[bodyKey];
    };


    // setメソッド
    hoge.prototype.set = function (bodyKey, bodyValue) {
        //"inputs"や"errors"のバリューを代入
        this.sessionBody[bodyKey] = bodyValue;
        return;
    };


    // deleteメソッド
    hoge.prototype.delete = function (bodyKey) {
        //セッションIDは消さずにinputsとerrorsのみ消す処理を書く
        delete this.sessionBody[bodyKey];
        return;
    };

    return hoge;
})();


//サーバーの起動
server.on("request", function (request, response) {
    ///// topページの時 /////
    if (request.url === "/") {
        // MySQLからデータを取得するためのクエリ
        var queryStatement =
            "SELECT singer.id, singer.name, song.title, song.lyric " +
            "FROM song " +
            "INNER JOIN singer_song ON singer_song.song_id = song.id " +
            "INNER JOIN composer ON composer.id = song.composer_id " +
            "INNER JOIN singer ON singer.id = singer_song.singer_id;";

        connection.query(queryStatement, function (err, rows) {
            if (err) {
                console.log("err: " + err);
            }
            //ファイル読み込み
            var templateOfSongsList = fs.readFileSync("../tmpl/registered_song_display.ejs", "utf8");
            //HTMLとMySQLから取ってきたデータをマージする
            var html = ejs.render(templateOfSongsList, {
                boardList: rows
            });
            response.writeHead(200, {"Content-Type": "text/html"});//htmlファイルだからhtml
            response.write(html);
            response.end();
        });


        ///// 新規登録画面の時 /////
    } else if (request.url === "/registration/") {
        var templateOfNewRegister = fs.readFileSync("../tmpl/register_new_song.ejs", "utf8");

        //sessionオブジェクト生成
        var session = new Session(request, response);
        // セッションから入力データとエラーを取ってくる。ない時は対応するハッシュを入れる。
        var inputs = session.get("inputs") || {title: "", singerName: "", mp3file: ""};
        var errors = session.get("errors") || {title: [], singerName: [], mp3file: []};

        var html = ejs.render(templateOfNewRegister, {
            inputtedTexts: inputs,
            errorMessages: errors
        });

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();


        ///// 新規登録ボタンを押した時の処理 /////
    } else if (request.url === "/registration/post") {
        var dataFromInputForms = "";
        // readableイベントが発火したらデータにリクエストボディのデータを追加
        request.on("readable", function () {
            dataFromInputForms += request.read();
        });
        // リクエストボディをすべて読み込んだらendイベントが発火する。
        request.on("end", function () {
            // パースしてinputsを作る
            var inputs = querystring.parse(dataFromInputForms);
            // 必須のデータはどれか指定する
            var dataRule = {
                title: ["not_blank", "character_code"],
                singerName: ["not_blank", "character_code"],
                mp3file: ["not_blank", "character_code"]
            }


            // セッションのbodyの中のerrorの設定
            // errors = { title: [Object], singerName: [Object], mp3file: [Object] } といった形になるはず
            var errors = {};
            Object.keys(dataRule).forEach(function (ruleKey) {
                var rule = dataRule[ruleKey]; // ruleは配列
                var value = inputs[ruleKey]; // valueは文字列
                for (var i = 0; i < rule.length; i++) { //実際のところ２回ループ
                    if (rule[i] == "not_blank") {
                        if (value == "") {
                            if (!errors[ruleKey]) {
                                errors[ruleKey] = [];
                            }
                            errors[ruleKey].push("入力してください");
                        }
                    }
                    if (rule[i] == "character_code") {
                        // 文字コードを検出。 結果が {encoding: 'UTF-8', confidence: 1} こういう感じ。
                        var detectResult = jschardet.detect(value);
                        var characterCode = detectResult["encoding"];
                        console.log(characterCode);
                        if (characterCode != "UTF-8" && characterCode != "ascii" && characterCode != null) {
                            if (!errors[ruleKey]) {
                                errors[ruleKey] = [];
                            }
                            errors[ruleKey].push("無効な文字が入力されています");
                        }
                    }
                }
            });

            var session = new Session(request, response);
            if (Object.keys(errors).length > 0) {
                // エラーがある時
                console.log(inputs, errors);
                session.set("inputs", inputs);
                session.set("errors", errors);
                response.writeHead(302, {"location": "/registration/"});
                response.end();
            } else {
                // エラーがなかった時
                ///////// DBにインサートする処理をここに書く//////////
                console.log("エラーなし！")
                session.delete("inputs");
                session.delete("errors");
                response.writeHead(302, {"location": "/"});
                response.end();
            }


            /* 歌手名と曲名の組み合わせがDBにないかチェックする。*/
            // 組み合わせがある時はホーム画面に戻り、ハイライトしておく（とりあえず後で）
            // 組み合わせがない時はウェブサイト(Uta-Net)から検索


        });
    }
});


server.listen(settings.port, settings.host);
