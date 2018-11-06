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
	foodItemId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	manufacturer VARCHAR (255) NOT NULL,
	name VARCHAR (255) NOT NULL,
	gramsServingSize INT,
	calories INT,
	totalFat DECIMAL (3,1),
	saturatedFat DECIMAL (3,1),
	transFat DECIMAL (3,1),
	cholesterol INT,
	sodium INT,
	totalCarbohydrates INT,
	dietaryFiber INT,
	sugars INT,
	protein INT);

create table foodItemServingSize (
	foodItemServingSizeId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	foodItemId INT NOT NULL,
	description VARCHAR(255) NOT NULL,
	grams INT NOT NULL);

create table foodItemSource (
	foodItemSourceId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	foodItemId INT NOT NULL,
	description VARCHAR(255) NOT NULL,
	price DECIMAL(6,2)
);

create table foodItemSourceContents (
	foodItemSourceId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	description VARCHAR(255) NOT NULL,
	foodItemSourceId INT NOT NULL,
	quantity INT NOT NULL
}
	
create table foodItemEvent (
	foodItemEventId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	tripId INT NOT NULL,
	foodItemId INT NOT NULL,
	mealItem INT NOT NULL,
	day INT NOT NULL,
	portion FLOAT);

create table dayTemplate (
	dayTemplateId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	name VARCHAR (255),
	userId int NOT NULL
);

create table dayTemplateFoodItem (
	dayTemplateFoodItemId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	dayTemplateId INT NOT NULL,
	foodItemId INT NOT NULL,
	foodItemServingSizeId INT NOT NULL,
	numberOfServings DECIMAL(7,3) NOT NULL
);
