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
	mealTimeId INT NOT NULL,
	foodItemId INT NOT NULL,
	foodItemServingSizeId INT NOT NULL,
	numberOfServings DECIMAL(7,3) NOT NULL
);

create table hike (
	hikeId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	name VARCHAR (255) NOT NULL,
	file VARCHAR (255));
	
create table userHike (
	userHikeId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	userId INT NOT NULL,
	hikeId INT NOT NULL,
	name VARCHAR (255) NOT NULL,
	data TEXT
);

create table pointOfInterest (
	pointOfInterestId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	hikeId INT,		-- Either hikeId or userHikeId must be set but not both
	userHikeId INT,
	lat DECIMAL(17,14) NOT NULL,
	lng DECIMAL(17,14) NOT NULL,
	name VARCHAR (255),
	description VARCHAR (255));

create table pointOfInterestConstraint (
	pointOfInterestConstraintId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	pointOfInterestId INT NOT NULL,
	type VARCHAR (255),
	time INT);
	
create table shippingLocation (
	shippingLocationId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
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
	resupplyEventId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	userHikeId INT NOT NULL,
	shippingLocationId INT NOT NULL);

create table hikerProfile (
	hikerProfileId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	userId INT NOT NULL,
	userHikeId INT, 		-- if this is null then this applies to all trails (there should only be one in this state)
	startDay INT, 			-- if this is null then the start is the beinning of the trail
	endDay INT, 			-- if this is null then the end is at the end of the trail
	speedFactor INT,
	startTime DECIMAL(4,2),
	endTime DECIMAL(4,2),
	breakDuration DECIMAL(4,2));
	
create table trailCondition (
	trailConditionId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	creationDate DATETIME NOT NULL,
	modificationDate DATETIME NOT NULL,
	hikeId INT,		-- Either hikeId or userHikeId must be set but not both
	userHikeId INT,
	startLat DECIMAL(17,14) NOT NULL,
	startLng DECIMAL(17,14) NOT NULL,
	endLat DECIMAL(17,14) NOT NULL,
	endLng DECIMAL(17,14) NOT NULL,
	type INT NOT NULL, -- 0 = no camping, 1 = no stealth camping, 2 = custom
	description VARCHAR(255),
	speedFactor INT);
