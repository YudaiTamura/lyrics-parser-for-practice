CREATE DATABASE lyrics_database;
USE lyrics_database;



CREATE TABLE IF NOT EXISTS `lyric` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lyric` TEXT,
  `title` VARCHAR(50),
  PRIMARY KEY(`id`)
  UNIQUE(`lyric`) )
DEFAULT CHARACTER SET = utf8;


CREATE TABLE IF NOT EXISTS `lyric_singer` (
  `lyric_id` INT(10) UNSIGNED NOT NULL,
  `singer` VARCHAR(50),
  PRIMARY KEY(`lyric_id`) )
DEFAULT CHARACTER SET = utf8;


CREATE TABLE IF NOT EXISTS `waiting` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `singer` VARCHAR(50),
  `title` VARCHAR(50),
  PRIMARY KEY(`id`),
  UNIQUE(`singer`, `title`) )
DEFAULT CHARACTER SET = utf8;

