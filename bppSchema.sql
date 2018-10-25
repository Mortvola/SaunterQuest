create table user (
	userId int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	username varchar(255) NOT NULL,
	emailAddress varchar(255) NOT NULL,
	password varchar(255) NOT NULL);

create table trip (
	tripId int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	userId int NOT NULL,
	tripName VARCHAR(255) NOT NULL,
	tripStartDate DATE);

create table foodItem (
	footItemId int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	name VARCHAR (255),
	weight INT,
	calories INT,
	price DECIMAL (6,2));

create table foodItemEvent (
	foodItemEventId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	tripId INT NOT NULL,
	foodItemId INT NOT NULL,
	mealItem INT NOT NULL,
	day INT NOT NULL,
	portion FLOAT);

