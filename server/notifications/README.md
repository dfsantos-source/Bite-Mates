Author: Dane Santos
<br>
Github ID: dfsantos-source

# Notifications Service

## Description
The Notifications Service is responsible for creating notifications and sending them to users or drivers, based on varying conditions (ie. pickup/delivery, user/driver, payments, orders, wallets, etc.) The reasoning is so users and drivers can be more informed at every step of the process in live-time.

## Services it communicates to
The Notifications Service interacts with six other services. Those services are: Driver Service, User Service, Delivery Service, Pickup Service, Wallet Service, Restaurant Service. The Notifications Service handles eight incoming events from those services. 


Those events are:

<ul>
<li>DriverCreated</li>
<li>UserCreated</li>
<li>OrderCreated</li>
<li>OrderProcessed</li>
<li>OrderCompleted</li>
<li>MoneyAdded</li>
<li>DriverAssigned</li>
<li>OrderReady</li>
</ul>

### 1. Driver Service Communication
The Driver Service, upon the successful registration of a driver, will communicate to the Notifications Service through the event: "DriverCreated". The Notifications Service will then create a driver in its own respective database and use the driver's `doNotDisturb` field to determine if the notification should be sent.

### 2. User Service Communication
The User Service, upon the successful registration of a user, will communicate to the Notifications Service through the event: "UserCreated". The Notifications Service will then create a user in its own respective database and use the user's `doNotDisturb` field to determine if the notification should be sent.

### 3. Delivery Service Communication
The Delivery Service communicates to the Notifications service through two events, 1. OrderCreated event 2. DriverAssigned event. When the Notification Service receives an OrderCreated event it will notify the user that their delivery order was successfully placed. When DriverAssigned received, a notification will be sent to the driver.

### 4. Pickup Service Communication
The Pickup Service communicates to the Notifications service through the OrderCreated event, and it will notify the user that their pickup order was successfully placed. 

### 5. Wallet Service Communication
The Wallet Service communicates to the Notifications service through two events, 1. OrderProcessed event 2. MoneyAdded event. When the Notification Service receives an OrderProcessed event it will send a notification to the user that their payment was either rejected and they need to add more funds to their wallet or that the payment was successful and funds have been deducted from their account. Secondly, when the Notification Service receives a MoneyAdded event, it will notify the user that money was successfully added along with their updated balance, so that they are aware of what is happening.

### 6. Restaurant Service Communication
The Restaurant Service communicates to the Notifications Service through the "OrderReady" event. This event will notify the user that their food is ready to be picked up.

## Endpoints

---
### Get all user notifications
---
Get all notifications for the user. Auth token needed.

**URL**: `/api/notification/user/get`

**METHOD**: `GET`

**BODY**:

Request Data Constraints: 
```
{"userId": string}
```

Request Data Example: 
```json
{"userId": "639992ccccf41e2dd8307faa"}
```

**RESPONSE**:

- `200`: If notifications for the user can be retrieved

  Response Data Constraints:

  ```
  { 
    [
        {
            "_id": string,
            "userId": string,
            "notificationMessage": string,
            "isRead": boolean
        }
    ]
  }
  ```

  Response Data Example:

  ```json
    [
        {
            "_id": "639992ccccf41e2dd8307fa9",
            "userId": "6399926af6c7ec8902a76572",
            "notificationMessage": "Your delivery order has been placed!",
            "isRead": false
        },
        {
            "_id": "639992ccccf41e2dd8307faa",
            "userId": "6399926af6c7ec8902a76572",
            "notificationMessage": "Your payment has been received and funds have been deducted from your account",
            "isRead": false
        },
        {
            "_id": "63999316ccf41e2dd8307fac",
            "userId": "6399926af6c7ec8902a76572",
            "notificationMessage": "Your food has arrived at your residential area! Enjoy!",
            "isRead": false
        }
    ]
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Get all driver notifications
---
Get all notifications for the driver. Auth token needed.

**URL**: `/api/notification/driver/get`

**METHOD**: `GET`

**BODY**:

Request Data Constraints: 
```
{"driverId": string}
```

Request Data Example: 
```json
{"driverId": "639992ccccf41e2dd8307faa"}
```

**RESPONSE**:

- `200`: If notifications for the driver can be retrieved

  Response Data Constraints:

  ```
  { 
    [
        {
            "_id": string,
            "driverId": string,
            "notificationMessage": string,
            "isRead": boolean
        }
    ]
  }
  ```

  Response Data Example:

  ```json
    [
        {
            "_id": "63999306ccf41e2dd8307fab",
            "driverId": "639992f3e45f4d396a762e49",
            "notificationMessage": "A delivery has been assigned to you!",
            "isRead": false
        }
    ]
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Create a user notification
---
Create a notification for a user

**URL**: `/api/notification/user/create`

**METHOD**: `POST`

**BODY**:

Request Data Constraints: 

```
{
    "userId": string,
    "notificationMessage": string
}
```

Request Data Example:

```json
{
    "userId": "63999306ccf41e2dd8307fab",
    "notificationMessage": "Your delivery order has been placed!"
}
```

**RESPONSE**:

- `201 CREATED`: If the notification can be created for the user

  Response Data Constraints:

  ```
    {
        "_id": string,
        "userId": string,
        "notificationMessage": string,
        "isRead": boolean
    }
  ```

  Response Data Example:

  ```json
    {
        "_id": "639992ccccf41e2dd8307fa9",
        "userId": "6399926af6c7ec8902a76572",
        "notificationMessage": "Your delivery order has been placed!",
        "isRead": false
    }

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Create a driver notification
---
Create a notification for a driver

**URL**: `/api/notification/driver/create`

**METHOD**: `POST`

**BODY**:

Request Data Constraints: 

```
{
    "driverId": string,
    "notificationMessage": string
}
```

Request Data Example:

```json
{
    "driverId": "63999306ccf41e2dd8307fab",
    "notificationMessage": "A delivery order has been assigned to you!"
}
```

**RESPONSE**:

- `201 CREATED`: If the notification can be created for the driver

  Response Data Constraints:

  ```
    {
        "_id": string,
        "driverId": string,
        "notificationMessage": string,
        "isRead": boolean
    }
  ```

  Response Data Example:

  ```json
    {
        "_id": "63999306ccf41e2dd8307fab",
        "driverId": "639992f3e45f4d396a762e49",
        "notificationMessage": "A delivery has been assigned to you!",
        "isRead": false
    }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Update user notification
---
Updates the isRead field of a notification, marking it as read

**URL**: `/api/notification/user/update/:notificationId`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints: 
<<<<<<< HEAD
```
=======
```json
>>>>>>> b4f822b045cc7e6720ce90c9084a1a2906c3b018
{
    "isRead": boolean
}
```

Request Data Example:
```json
{
    "isRead": true
}
```

**RESPONSE**:

- `200 SUCCESS`: If the notification was successfully marked as read 

  Response Data Constraints:

  ```
  {
      "_id": string,
      "userId": string,
      "notificationMessage": string,
      "isRead": boolean
  }
  ```

  Response Data Example:

  ```json
  {
      "_id": "639992ccccf41e2dd8307fa9",
      "userId": "6399926af6c7ec8902a76572",
      "notificationMessage": "Your delivery order has been placed!",
      "isRead": true
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `404 NOT FOUND`: If the notification cannot be found
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Update driver notification
---
Updates the isRead field of a notification, marking it as read

**URL**: `/api/notification/driver/update/:notificationId`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints: 
<<<<<<< HEAD
```
=======
```json
>>>>>>> b4f822b045cc7e6720ce90c9084a1a2906c3b018
{
    "isRead": boolean
}
```

Request Data Example:
```json
{
    "isRead": true
}
```

**RESPONSE**:

- `200 SUCCESS`: If the notification was successfully marked as read 

  Response Data Constraints:

  ```
    {
        "_id": "639992ccccf41e2dd8307fa9",
        "userId": "6399926af6c7ec8902a76572",
        "notificationMessage": "Your delivery order has been placed!",
        "isRead": true
    }
  ```

  Response Data Example:

  ```json
    {
        "_id": "63999306ccf41e2dd8307fab",
        "driverId": "639992f3e45f4d396a762e49",
        "notificationMessage": "A delivery has been assigned to you!",
        "isRead": true
    }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `404 NOT FOUND`: If the notification cannot be found
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur



## How to run
<<<<<<< HEAD
In order for this service to run you must run the `docker compose` command. The docker compose command will build all the docker containers for each service including the event bus and the frontend. This will also install all dependencies needed for each service and provision an independent MongoDB database respective to each service. Additionally, the docker compose has an environment variable `ACCESS_TOKEN` which the service uses for parsing JWT tokens.  The 4006 port is the port that this service is running on and it gets mapped to the docker container and stores a volume for the `mongodb_notifications_container`. This service depends on the Driver Service, User Service, Delivery Service, Pickup Service, Wallet Service, Restaurant Service so they must be running in order for this service to work. Additionally, the event bus must be running, and should have succesfully subscribed to all of the events it needs prior to any API endpoints being called.
=======
In order for this service to run you must run the `docker compose` command. The docker compose command will build all the docker containers for each service including the event bus and the frontend. This will also install all dependencies needed for each service and provision an independent MongoDB database respective to each service. The 4006 port is the port that this service is running on and it gets mapped to the docker container and stores a volume for the `mongodb_notifications_container`. This service depends on the Driver Service, User Service, Delivery Service, Pickup Service, Wallet Service, Restaurant Service so they must be running in order for this service to work. Additionally, the event bus must be running, and should have succesfully subscribed to all of the events it needs prior to any API endpoints being called.
>>>>>>> b4f822b045cc7e6720ce90c9084a1a2906c3b018
