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
// ファイル取得用モジュール
const formidable = require('formidable');

// サーバーを立てる
var server = http.createServer();
// ホストとポートの設定のインポート
var settings = require("./settings");

// MySQLとのコネクション確立
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "lyrics_database2"
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
        //セッションIDは消さずにinputsとerrorsのみ消す
        delete this.sessionBody[bodyKey];
        return;
    };
    return hoge;
})();


//サーバーの起動
server.on("request", function (request, response) {
    // URL全体をリクエストヘッダから取ってくる
    var wholeURL = request.url;
    // wholeURLの中の"?"の前後で分割して、
    // "?"の前がアクセスしたいURL(targetURL)
    var targetURL = wholeURL.split("?")[0];
    // "?"の後ろがクエリパラメータ(queryParameter)
    var queryParameter = wholeURL.split("?")[1];


    ///// topページの時 /////
    if (targetURL === "/") {
        // dataFromSearchingFormsにgetのデータを追加
        var dataFromSearchingForms = querystring.parse(queryParameter);
        var inputtedSingerName = dataFromSearchingForms["singerName"];
        var inputtedTitle = dataFromSearchingForms["title"];
        var getDataQuery;
        var bindValue;

        // トップページから曲を検索した時
        if (inputtedSingerName && inputtedTitle) {
            // 検索フォームに入力された曲名と歌手名に合致するデータを取得するためのクエリ
            getDataQuery =
                "SELECT singer.id, singer.name, song.title, song.lyric " +
                "FROM song " +
                "INNER JOIN singer_song ON singer_song.song_id = song.id " +
                "INNER JOIN singer ON singer.id = singer_song.singer_id " +
                "WHERE singer.name = ? AND song.title = ?;";
            bindValue = [inputtedSingerName, inputtedTitle];
        } else if (inputtedSingerName) {
            // 検索フォームに入力された歌手名に合致するデータを取得するためのクエリ
            getDataQuery =
                "SELECT singer.id, singer.name, song.title, song.lyric " +
                "FROM song " +
                "INNER JOIN singer_song ON singer_song.song_id = song.id " +
                "INNER JOIN singer ON singer.id = singer_song.singer_id " +
                "WHERE singer.name = ?;";
            bindValue = [inputtedSingerName];
        } else if (inputtedTitle) {
            // 検索フォームに入力された曲名に合致するデータを取得するためのクエリ
            getDataQuery =
                "SELECT singer.id, singer.name, song.title, song.lyric " +
                "FROM song " +
                "INNER JOIN singer_song ON singer_song.song_id = song.id " +
                "INNER JOIN singer ON singer.id = singer_song.singer_id " +
                "WHERE song.title = ?;";
            bindValue = [inputtedTitle];
        } else {
            // MySQL上にあるすべての曲のデータを取得するためのクエリ
            getDataQuery =
                "SELECT singer.id, singer.name, song.title, song.lyric " +
                "FROM song " +
                "INNER JOIN singer_song ON singer_song.song_id = song.id " +
                "INNER JOIN singer ON singer.id = singer_song.singer_id;";
            bindValue = [];
        }

        connection.query(getDataQuery, bindValue, function (err, rows) {
            if (err) {
                console.log("err: " + err);
            }
            //ファイル読み込み
            var templateOfSongsList = fs.readFileSync("../tmpl/registered_song_display.ejs", "utf8");

            //sessionオブジェクト生成
            var referenceSession = new Session(request, response);
            // セッションから入力データとエラーを取ってくる。ない時は対応するハッシュを入れる。
            var inputs = referenceSession.get("inputs") || {title: "", singerName: ""};
            var errors = referenceSession.get("errors") || {title: [], singerName: []};
            //HTMLとMySQLから取ってきたデータをマージする
            var html = ejs.render(templateOfSongsList, {
                boardList: rows
            });
            response.writeHead(200, {"Content-Type": "text/html"});//htmlファイルだからhtml
            response.write(html);
            response.end();
        });


        ///// 新規登録画面の時 /////
    } else if (targetURL === "/registration/") {
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


        ///// 新規登録画面にある新規登録ボタンを押した時の処理 /////
    } else if (targetURL === "/registration/post") {
        var dataFromInputForms = "";
        // readableイベントが発火したらデータにリクエストボディのデータを追加
        request.on("readable", function () {
            dataFromInputForms += request.read();
        });
        // リクエストボディをすべて読み込んだらendイベントが発火する。
        request.on("end", function () {
            // パースしてinputsを作る
            var inputs = querystring.parse(dataFromInputForms);
            // 必須のデータはどれかをdataRule基準で指定する
            var dataRule = {
                title: ["not_blank", "character_code"],
                singerName: ["not_blank", "character_code"],
                mp3file: ["not_blank", "file_format"]
            }
            // セッションのbodyの中のerrorの設定
            var errors = {};
            Object.keys(dataRule).forEach(function (ruleKey) {
                var rule = dataRule[ruleKey]; // ruleは配列
                var value = inputs[ruleKey]; // valueは文字列
                for (var i = 0; i < rule.length; i++) { //実際のところ２回ループ
                    // 入力フォームに入力されているか判定
                    if (rule[i] === "not_blank") {
                        if (value == "") {
                            if (!errors[ruleKey]) {
                                errors[ruleKey] = [];
                            }
                            errors[ruleKey].push("入力してください");
                        }
                    }
                    // テキストボックスに入力された文字がUTF-8もしくはasciiになっているか判定
                    if (rule[i] === "character_code") {
                        // 文字コードを検出。 結果が {encoding: 'UTF-8', confidence: 1} こういう感じ。
                        var detectResult = jschardet.detect(value);
                        var characterCode = detectResult["encoding"];
                        if (characterCode != "UTF-8" && characterCode != "ascii" && characterCode != null) {
                            if (!errors[ruleKey]) {
                                errors[ruleKey] = [];
                            }
                            errors[ruleKey].push("無効な文字が入力されています");
                        }
                    }
                    // ファイル選択で選択されたファイルがmp3かどうか判定
                    if (rule[i] === "file_format") {
                        if (value.slice(-4) != ".mp3" && value != "") {
                            if (!errors[ruleKey]) {
                                errors[ruleKey] = [];
                            }
                            errors[ruleKey].push("MP3ファイルを入力してください");
                        }
                    }
                }
            });
            // 実際に新規登録ボタンを押した時の動作
            var session = new Session(request, response);
            // エラーがある時
            if (Object.keys(errors).length > 0) {
                // セッションに入力されたものとエラーの内容をセット
                session.set("inputs", inputs);
                session.set("errors", errors);
                // 新規登録画面にリダイレクト
                response.writeHead(302, {"location": "/registration/"});
                response.end();

            } else { // エラーがない時（ちゃんと通った時）
                // セッションのボディを削除(正確には元の状態に戻す)
                session.delete("inputs");
                session.delete("errors");
                // 歌手名と曲名の組み合わせがDBにあるかチェック
                var checkQuery =
                    "SELECT singer.id, singer.name, song.title " +
                    "FROM song " +
                    "INNER JOIN singer_song ON singer_song.song_id = song.id " +
                    "INNER JOIN singer ON singer.id = singer_song.singer_id " +
                    "WHERE singer.name = ? AND song.title = ?;";
                connection.query(checkQuery, [inputs["singerName"], inputs["title"]], function (err, rows) {
                    if (err) {
                        console.log("err: " + err);
                    }
                    // 歌手名と曲名の組み合わせがDBにある時
                    if (rows.length > 0) {
                        // アンカーをつけて、トップページに戻る。
                        response.writeHead(302, {"location": "/#anchor" + rows[0]["id"]});
                        response.end();
                    } else { // 歌手名と曲名の組み合わせがDBにない時
                        //とりあえずDBに歌手名と曲名をインサートしてlyricとmp3pathはNULLのままほっておく
                        connection.query("INSERT INTO singer(name) VALUES(?);", [inputs["singerName"]], function () {
                            connection.query("SELECT LAST_INSERT_ID()", function (err, rows) {
                                var singerID = rows[0]["LAST_INSERT_ID()"];
                                connection.query("INSERT INTO song(title) VALUES(?);", [inputs["title"]], function () {
                                    connection.query("SELECT LAST_INSERT_ID()", function (err, songID) {
                                        var songID = rows[0]["LAST_INSERT_ID()"];
                                        connection.query("INSERT INTO singer_song(singer_id, song_id) VALUES(?, ?)", [singerID, songID]);
                                    });
                                });
                            });
                        });





                        // インサート後、トップページにリダイレクト
                        response.writeHead(302, {"location": "/"});
                        response.end();
                    }
                });
            }
        });

    } else {
        response.writeHead(404, {"Content-Type": "text/html"});
        response.write("404 Not Found\n");
        response.end();
    }

});

server.listen(settings.port, settings.host);