
CREATE TABLE ox_items (
  `name` VARCHAR(50) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  `weight` INT(10) UNSIGNED NULL DEFAULT NULL,
  `width` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
  `height` TINYINT(3) UNSIGNED NULL DEFAULT NULL,
  `category` VARCHAR(50) NULL DEFAULT NULL,
  `decay` TINYINT(1) UNSIGNED NULL DEFAULT NULL,
  `itemLimit` INT(10) UNSIGNED NULL DEFAULT NULL,
  `stackSize` SMALLINT(5) UNSIGNED NULL DEFAULT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `icon` VARCHAR(100) NULL DEFAULT NULL,
  `value` INT(10) UNSIGNED NULL DEFAULT NULL,
  `rarity` VARCHAR(50) NULL DEFAULT NULL,
  `degrade` INT(10) UNSIGNED NULL DEFAULT NULL,
  `tradeable` TINYINT(1) UNSIGNED NULL DEFAULT NULL
);

CREATE TABLE `ox_inventories` (
	`inventoryId` VARCHAR(50) NOT NULL,
	`ownerId` VARCHAR(50) NOT NULL,
	`type` VARCHAR(50) NOT NULL
);

CREATE TABLE `ox_inventory_items` (
	`inventoryId` VARCHAR(50) NULL DEFAULT NULL,
	`uniqueId` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(50) NOT NULL,
	`metadata` JSON NOT NULL,
	PRIMARY KEY (`uniqueId`)
);
