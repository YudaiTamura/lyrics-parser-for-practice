CREATE DATABASE lyrics_database;
USE lyrics_database;


CREATE TABLE IF NOT EXISTS `song` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50),
  `singer_id` VARCHAR(50),
  `lyric` TEXT,
  PRIMARY KEY (`id`),
  UNIQUE(`title`, `singer_id`)
)
DEFAULT CHARACTER SET = utf8;



CREATE TABLE IF NOT EXISTS `singer` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `singer` VARCHAR(50),
  `song_id` INT(10),
  PRIMARY KEY (`id`) ),
  UNIQUE(`singer`, `song_id`)
)
DEFAULT CHARACTER SET = utf8;



CREATE TABLE IF NOT EXISTS `version` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `version` VARCHAR(50),
  PRIMARY KEY (`id`) ),
  UNIQUE(`version`)
)
DEFAULT CHARACTER SET = utf8;



CREATE TABLE IF NOT EXISTS `version_song` (
  `song_id` INT(10),
  `version` VARCHAR(50),
  UNIQUE(`song_id`, `version`)
)
DEFAULT CHARACTER SET = utf8;




CREATE TABLE IF NOT EXISTS `waiting` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `singer` VARCHAR(50),
  `title` VARCHAR(50),
  PRIMARY KEY (`id`) ),
  UNIQUE(`singer`, `title`)
)
DEFAULT CHARACTER SET = utf8;
