create table user (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	username varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	password varchar(255) NOT NULL,
	name varchar(255),
	rememberToken varchar(100),
	emailVerifiedDate DATETIME);

// View to satisfy the needs of laravel.
create view users as
select id, creationDate as created_at, modificationDate as updated_at, username, email, password, name, rememberToken as remember_token, emailVerifiedDate as email_verified_at
from user;

create table trip (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	userId int NOT NULL,
	tripName VARCHAR(255) NOT NULL,
	tripStartDate DATE);

create table foodItem (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	manufacturer VARCHAR (255) NOT NULL,
	name VARCHAR (255) NOT NULL,
	servingSizeDescription VARCHAR(255),
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
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	foodItemId INT NOT NULL,
	description VARCHAR(255) NOT NULL,
	grams INT NOT NULL);

create table foodItemSource (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	foodItemId INT NOT NULL,
	description VARCHAR(255) NOT NULL,
	price DECIMAL(6,2)
);

create table foodItemSourceContents (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	description VARCHAR(255) NOT NULL,
	foodItemSourceId INT NOT NULL,
	quantity INT NOT NULL
}
	
create table foodItemEvent (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	tripId INT NOT NULL,
	foodItemId INT NOT NULL,
	mealItem INT NOT NULL,
	day INT NOT NULL,
	portion FLOAT);

create table dayTemplate (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	name VARCHAR (255),
	userId int NOT NULL
);

create table dayTemplateFoodItem (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	dayTemplateId INT NOT NULL,
	mealTimeId INT NOT NULL,
	foodItemId INT NOT NULL,
	foodItemServingSizeId INT NOT NULL,
	numberOfServings DECIMAL(7,3) NOT NULL
);

create table hike (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	name VARCHAR (255) NOT NULL,
	file VARCHAR (255));
	
create table userHike (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	userId INT NOT NULL,
	hikeId INT,
	name VARCHAR (255) NOT NULL
);

create table pointOfInterest (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	hikeId INT,		-- Either hikeId or userHikeId must be set but not both
	userHikeId INT,
	lat DECIMAL(17,14) NOT NULL,
	lng DECIMAL(17,14) NOT NULL,
	name VARCHAR (255),
	description VARCHAR (255));

create table pointOfInterestConstraint (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	pointOfInterestId INT NOT NULL,
	type VARCHAR (255),
	time INT);
	
create table shippingLocation (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	hikeId INT,		-- Either hikeId or userHikeId must be set but not both
	userHikeId INT,
	lat DECIMAL(17,14) NOT NULL,
	lng DECIMAL(17,14) NOT NULL,
	name VARCHAR(255) NOT NULL,
	inCareOf VARCHAR(255),
	address1 VARCHAR(255) NOT NULL,
	address2 VARCHAR(255),
	city VARCHAR(255) NOT NULL,
	state VARCHAR(255) NOT NULL,
	zip VARCHAR(255) NOT NULL);
	
create table resupplyEvent (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	userHikeId INT NOT NULL,
	shippingLocationId INT NOT NULL);

create table hikerProfile (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	userId INT NOT NULL,
	userHikeId INT, 		-- if this is null then this applies to all trails (there should only be one in this state)
	startDay INT, 			-- if this is null then the start is the beinning of the trail
	endDay INT, 			-- if this is null then the end is at the end of the trail
	speedFactor INT,
	startTime DECIMAL(4,2),
	endTime DECIMAL(4,2),
	breakDuration DECIMAL(4,2));
	
create table trailCondition (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modificationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	hikeId INT,		-- Either hikeId or userHikeId must be set but not both
	userHikeId INT,
	startLat DECIMAL(17,14) NOT NULL,
	startLng DECIMAL(17,14) NOT NULL,
	endLat DECIMAL(17,14) NOT NULL,
	endLng DECIMAL(17,14) NOT NULL,
	type INT NOT NULL, -- 0 = no camping, 1 = no stealth camping, 2 = custom
	description VARCHAR(255),
	speedFactor INT);
