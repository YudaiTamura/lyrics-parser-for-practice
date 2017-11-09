# 無限ループの中で任意秒待つためのモジュール
import time
# MySQLに接続するためのモジュール
import mysql.connector
# ウェブサイトからHTMLを取ってくるためのモジュール
import urllib
# 曲名で検索した結果を表示してる画面のURLのもと(URLtoSearchByTitle[1] には後から曲の名前が入る)
listURLtoSearchByTitle = ["https://www.uta-net.com/search/?Aselect=2&Keyword=", "", "&Bselect=4"]
# HTMLパーサー
from bs4 import BeautifulSoup



while True:
    print("check if the programming is running")
    time.sleep(10) #2秒待ってから実行
    
    # DBに接続する
    connection = mysql.connector.connect(user='root', host='localhost', database='lyrics_database2')
    # カーソルを取得する
    cursor = connection.cursor()
    # クエリの実行
    cursor.execute(
        "SELECT singer.id, singer.name, song.title, song.lyric " +
        "FROM song " +
        "INNER JOIN singer_song ON singer_song.song_id = song.id " +
        "INNER JOIN singer ON singer.id = singer_song.singer_id;"
    )
    # 実行結果をすべて取得
    rows = cursor.fetchall()
    
    
    
    for row in rows:
        lyrics = row[3]
        # 歌詞がNULLの時は歌詞をweb(Uta-Net)に取りに行く
        if lyrics is None:
            ###### まずは曲名で検索 ######
            singerName = row[1]
            title = row[2]
            # 配列 listURLtoSearchByTitleを成型して、文字列stringURLtoSearchByTitleにする
            listURLtoSearchByTitle[1] = urllib.parse.quote_plus(title, encoding='utf-8')
            stringURLtoSearchByTitle = "".join(listURLtoSearchByTitle)
            # HTMLファイルを開く
            data = urllib.request.urlopen(stringURLtoSearchByTitle)
            # HTMLの取得
            html = data.read()
            # HTMLファイルを閉じる
            data.close()
            # BeautifulSoupオブジェクトの作成
            soup = BeautifulSoup(html, "lxml")
            # 取得したいタグの種類とクラス属性を指定し、歌手名をリストで取得
            singerNames = soup.findAll("td", class_="td2")
            
            
            ### 曲名を元に検索して出てきたものの中から歌手名も一致するものを選択する ###
            # for文の最初で+1するため、indicatorの初期値は0ではなく-1にしておく
            indicator = -1
            # targetの定義
            target = ""
            
            
            ## 検索したい曲のページのURLの取得
            for td in singerNames:
                indicator += 1
                targetSingerName = td.find("a").text
                print("11111"+targetSingerName)
                print("222222"+singerName)
                if targetSingerName == singerName:
                    urls = soup.findAll("td", class_ = "side td1")
                    kk = -1
                    for td2 in urls:
                        kk += 1
                        targetURL = td2.find("a").attrs['href']
                        if kk == indicator:
                            target = "https://www.uta-net.com" + targetURL
                            break
                    
                    ## 検索したいページを開いてから歌詞を手に入れるまでのながれ
                    data = urllib.request.urlopen(target)
                    # HTMLの取得
                    html = data.read()
                    # HTMLファイルを閉じる
                    data.close()
                    # BeautifulSoupオブジェクトの作成
                    soup = BeautifulSoup(html, "lxml")
                    # 取得したいタグの種類とクラス属性を指定し、歌詞を取得
                    lyricsFromHTML = soup.find("div", id = "kashi_area")
                    # lyricsFromHTMLを成型(文字列にしてからhtmlタグを削除)
                    stringLyricsFromHTML = str(lyricsFromHTML)
                    parsedLyrics = stringLyricsFromHTML.replace('<div id="kashi_area">', "").replace("</div>", "").replace("<br/>", "")

                    # DBに歌詞を書き込み
                    cursor.execute(
                        "UPDATE song SET lyric = '" + parsedLyrics + "'" +
                        "WHERE id = " + str(row[0]) + ";"
                    )
                    connection.commit()
                    break
                
              # 曲名で検索した結果がなかった時はどうする？
                   
    cursor.close
    connection.close