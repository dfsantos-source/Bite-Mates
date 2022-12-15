# Review Comment Service 

### Person Responsible:

Name: Aayush Bhagat
Github ID: Aayush-Bhagat

### Description: 

The Review Comment Service is responsible for creating and get reviews for any specific restaurant or driver review. This service allows the user to create a comment for any restaurant or driver review. This service also can get all the comments for any specific driver or restaurant review, so that the user can see all the comments contributed to a review.

### How to run the service:

You should be running this service with the ``` docker-compose up ``` command, as it relies on the review-comment mongodb container to run for its database. The docker compose also has environment variable secrets such as the ACCESS_TOKEN for parsing jsonwebtokens for user authentication and the Database url to connect to the database. The service also relies on the eventbus and other services such as the review service, driver service, user service, and restaurant service as it will receive events from those service.To run it from scratch you will need to first ``` npm install``` then you will need to run ``` npm run build``` and then run ```npm start```, but you must have all the dependencies from above to run it from scratch without the docker-compose.

### Interactions and Events: 

##### - UserCreated Event:
* Created/Received: Received
* Description: Receives an event from the event bus that a user was created so that it can add that user to the database so it can use it  for relationships to all review comments.
* Received From: User service 
* Event Interface: 
```JS
{
    type: “UserCreated”,
    data:{
    _id: string,
    name: string
    address: string
    email: string
    doNotDisturb: boolean
    }
}
```

##### - DriverCreated Event:
* Created/Received: Received
* Description: Receives an event from the event bus that a driver is created so it can add that driver to its database, so it can use it  for relationships to driver review comments.
* Received From: Driver service 
* Event Interface: 
```JS
{
    type: “DriverCreated”,
    data:{
       _id: string,
       name: string,
       email: string
       doNotDisturb: boolean
    }
}
```

##### - DriverReviewCreated Event:
* Created/Received: Received
* Description: Receives an event from the event bus that a driver review was created so that it can add that review to its database, so it can use it for relationships to driver review comments.
* Received From: Review Service
* Event Interface: 
```JS
{
   type: DriverReviewCreated,
    data: {
       userId: String,
       driverId: String,
       content: String,
       rating: number,
       _id: String
     }
}

```

##### - RestaurantReviewCreated Event:
* Created/Received: Received
* Description: Receives an event from the event bus that a restaurant review was created so that it can add that user to the database, so it can use it  for relationships to restaurant review comments.
* Received From: Review Service
* Event Interface: 
```JS
{
   type: RestaurantReviewCreated,
   data:{
     _id: String
     restaurantId: String, 
     content: String
     reviewId: String
     userId: String
   }
}
```

##### - RestaurantCreated Event:
* Created/Received: Received
* Description: Receives an event from the event bus that a restaurant was created so that it can add that restaurant  to the database, so it can use it  for relationships to restaurant review comments.
* Received From: Restaurant Service
* Event Interface: 
```JS
{
    type: "RestaurantCreated"
    data: {
        _id: string,
       name: string,
       address: string,
       type: string
       foods: []
    }
}
```

### Endpoints

#### Create Restaurant Review Comment
###### Description: 
This endpoint is to allow users to comment on other user’s restaurant reviews.
###### HTTP Method: 
POST
###### Route:
"api/review-comment/restaurant/create"
###### authenticated:
This route is authenticated
###### Body Payload:
```JS
{
    restaurantId: string
    reviewId: string
    content: string
    userId: string
}

```
###### Response:
```JS
{
    _id: string,
    restaurantId: String, 
    content: string
    reviewId: String
    userId: String
}

```
###### Response Status:
created: 201
body incomplete: 400

#### Get Restaurant Review Comments

###### Description: 
This endpoint is to get all of the comments for a specific review.
###### HTTP Method: 
GET
###### Route:
"/api/review-comment/restaurant/get/:reviewId"
###### authenticated:
This route is not authenticated
###### Body Payload:
```
None
```
###### Response:
```JS
    [{
    _id: String
    restaurantId: String, 
    content: string,
    reviewId: String,
    userId: String
   }]
```
###### Response Status:
successful: 200
review not found: 404

#### Create Driver Review Comment

###### Description: 
This endpoint is to allow users to create comments on other user’s driver reviews.
###### HTTP Method: 
POST
###### Route:
"/api/review-comment/driver/create"
###### authenticated:
This route is authenticated
###### Body Payload:
```JS
{
    driverId: String,
    reviewId: String,
    content: string,
    rating: number
}
```
###### Response:
```JS
{
    _id: string
    rating: number, 
    reviewId: String,
    content: string
    userId: String
    drvierId: string
}
```
###### Response Status:
created: 201
reviewId not given: 400
body incomplete: 400


#### Get Driver Review Comments

###### Description: 
This endpoint is to get all of the comment for a specific driver review.
###### HTTP Method: 
GET
###### Route:
"api/review-comment/driver/get/:reviewId"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
None
```
###### Response:
```JS
[{
    reviewId: String,
    content: string,
    _id: String,
    userId: String
    driverId: String,
}]
```
###### Response Status:
successful: 200
reviewId not given: 400
Server error: 500