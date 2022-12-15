Author: Dane Santos
<br>
Github ID: dfsantos-source

# Driver Service

## Description
The Driver Service is responsible for creating Drivers and handling the login and register of drivers. This service uses extensive error handling, and uses bcrypt library for password hashing and JWT tokens for authorization.

## Services it communicates to
The Driver Service interacts with four other services. Those services are: Metrics Service, Notifications Service, Reviews Service, Review Comments Service.

### 1. Metrics Service
The Driver Service, upon the successful registration of a driver, will communicate to the Metrics Service through the event: "DriverCreated". The Metrics Service will then create a driver in its own respective database create a DriverMetric object respective to that driver.

### 2. Notifications Service
The Driver Service, upon the successful registration of a driver, will communicate to the Notifications Service through the event: "DriverCreated". The Notifications Service will then create a driver in its own respective database. This driver contains a doNotDisturb field which is used inside the Notifications Service so that notifications are not sent to drivers who have muted notifications.

### 3. Reviews Service
The Driver Service, upon the successful registration of a driver, will communicate to the Reviews Service through the event: "DriverCreated". The Reviews Service will then create a driver in its own respective database as a dependency needed for reviews.


### 4. Review Comments Service
The Driver Service, upon the successful registration of a driver, will communicate to the Review Comments Service through the event: "DriverCreated". The Review Comments Service will then create a driver in its own respective database as a dependency needed for review comments.

## Endpoints

---
### Register driver
---
Registers a driver

**URL**: `/api/drivers/register`

**METHOD**: `POST`

**BODY**:

Request Data Constraints:

```
{ 
  "name" : string, 
  "email": string, 
  "password": string 
}
```

Request Data Example:

```json
{ 
  "name" : "George Bush", 
  "email": "georgebush@umass.edu", 
  "password": "lolme123"
}
```

**RESPONSE**:

- `201`: If the driver is able to successfully register

  Response Data Constraints:

  ```
  {
      "message": string,
      "_id": string,
      "name": string,
      "email": string,
      "doNotDisturb": boolean,
      "token": string
  }
  ```

  Response Data Example:

  ```json
  {
      "message": "Driver successfully registered",
      "_id": "639a66bfeb0644c3511e8b4e",
      "name": "George Bush",
      "email": "georgebush@umass.edu",
      "doNotDisturb": false,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzlhNjZiZmViMDY0NGMzNTExZThiNGUiLCJpYXQiOjE2NzEwNjMyMzF9.Wnj7WKmxhPHhBCxBYyP-78bBNUdXv6xSbh885fjBMaU"
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Login driver
---
Allows the driver to login. Provies an auth token upon successful login.

**URL**: `/api/drivers/login`

**METHOD**: `POST`

**BODY**:

Request Data Constraints:

```
{ 
  "email": string, 
  "password": string 
}
```

Request Data Example:

```json
{ 
  "email": "georgedriver@umass.edu", 
  "password": "lolme123"
}
```

**RESPONSE**:

- `200`: If the driver is able to successfully login

  Response Data Constraints:

  ```
  {
    "message": string,
    "_id": string,
    "name": string,
    "email": string,
    "doNotDisturb": boolean,
    "token": string
  }
  ```

  Response Data Example:

  ```json
  {
      "message": "Login successful",
      "_id": "639a66bfeb0644c3511e8b4e",
      "name": "George Bush",
      "email": "georgebush@umass.edu",
      "doNotDisturb": false,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzlhNjZiZmViMDY0NGMzNTExZThiNGUiLCJpYXQiOjE2NzEwNjMyMzF9.Wnj7WKmxhPHhBCxBYyP-78bBNUdXv6xSbh885fjBMaU"
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `404 NOT FOUND`: If cannot find driver with email or password (ie. incorrect)
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Get driver
---
Retrieves a driver, given a driverId. Auth token needed.

**URL**: `/api/drivers/get`

**METHOD**: `GET`

**BODY**:

Request Data Constraints: 
```
{"driverId": string}
```

Request Data Example:
```json
{"driverId": "639a66bfeb0644c3511e8b4e"}
```

**RESPONSE**:

- `200`: If the driver is able to be retrieved

  Response Data Constraints:

  ```
  {
    "_id": string,
    "name": string,
    "email": string,
    "doNotDisturb": boolean
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639992f3e45f4d396a762e49",
    "name": "george driver",
    "email": "georgedriver@umass.edu",
    "doNotDisturb": false
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If driverId is not a valid UUID/Mongo ObjectID
- `404 NOT FOUND`: If the driver cannot be found
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Update doNotDisturb driver
---
Updates the `doNotDisturb` field for a driver, so notifications can be sent/or not. A valid auth token must be provided

**URL**: `/api/drivers/update/doNotDisutrb`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints: 
```
{"driverId": string, "doNotDisutrb": boolean}
```

Request Data Example:
```json
{"driverId": "639a66bfeb0644c3511e8b4e", "doNotDisutrb": true}
```

**RESPONSE**:

- `200`: If the doNotDisturb field was updated for the driver

  Response Data Constraints:

  ```
  {
    "_id": string,
    "name": string,
    "email": string,
    "doNotDisturb": boolean
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639992f3e45f4d396a762e49",
    "name": "george driver",
    "email": "georgedriver@umass.edu",
    "doNotDisturb": true
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If driverId is not a valid UUID/Mongo ObjectID
- `404 NOT FOUND`: If the driver cannot be found
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Update email driver
---
Updates the `email` field for a driver. A valid auth token must be provided.

**URL**: `/api/drivers/update/email`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints: 
```
{"driverId": string, "email": string}
```

Request Data Example:
```json
{"driverId": "639992f3e45f4d396a762e49", "email": "dj@umass.edu"}
```

**RESPONSE**:

- `200`: If the email of the driver can be updated

  Response Data Constraints:

  ```
  {
    "_id": string,
    "name": string,
    "email": string,
    "doNotDisturb": boolean
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639992f3e45f4d396a762e49",
    "name": "george driver",
    "email": "georgedriver@umass.edu",
    "doNotDisturb": true
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If driverId is not a valid UUID/Mongo ObjectID
- `404 NOT FOUND`: If the driver cannot be found
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

## How to run
In order for this service to run you must run the `docker compose` command. The docker compose command will build all the docker containers for each service including the event bus and the frontend. This will also install all dependencies needed for each service and provision an independent MongoDB database respective to each service. Additionally, the docker compose has an environment variable `ACCESS_TOKEN` which the service uses for parsing JWT tokens. The `4002` port is the port that this service is running on and it gets mapped to the docker container and stores a volume for the `mongodb_driver_container`. This service depends on the Metrics Service, Notifications Service, Reviews Service, Review Comments Service so they must be running in order for this service to work. Additionally, the event bus must be running, and should have succesfully subscribed to all of the events it needs prior to any API endpoints being called.
