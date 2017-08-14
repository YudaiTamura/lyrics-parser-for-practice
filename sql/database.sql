CREATE DATABASE lyrics_database;
USE lyrics_database;
CREATE TABLE IF NOT EXISTS ‘lyrics’ (
  ‘id’ INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ‘title’ VARCHAR(50),
  ‘singer’ VARCHAR(50),
  ‘lyric’ VARCHAR(10000),
  ‘created_at’ DATETIME NOT NULL DEFAULT now(),
  ‘updated_at’ TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  PRIMARY KEY (‘id’) );
SHOW COLUMNS from lyrics;

