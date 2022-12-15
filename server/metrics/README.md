# Metrics Service 

### Person Responsible:

Name: Aayush Bhagat
Github ID: Aayush-Bhagat

### Description: 

The Metrics service is responsible for keeping metrics for the users, restaurants, and drivers in our application. These metrics include how many orders a user has and how much they have spent in total. How many orders a restaurant has, and how much they have made in total. How many deliveries a driver has had. Also it keeps track of how many restaurant and driver reviews that have been made and keeps track of the average rating for each restaurant and driver.

### How to run the service:

You should be running this service with the ``` docker-compose up ``` command, as it relies on the metrics mongodb container to run for its database. The docker compose also has environment variable secrets such as the Database url to connect to the database. The service also relies on the eventbus and other services to receive events from such as the Driver service, user service, review service, delivery service, and wallet service .To run it from scratch you will need to first ``` npm install``` then you will need to run ``` npm run build``` and then run ```npm start```, but you must have all the dependencies from above to run it from scratch without the docker-compose. This service also runs on port 4005.

### Interactions and Events: 

##### - UserCreated Event:
* Created/Received: Received
* Description: Receives an event from the event bus that a user was created so that it can add that user to the database and also create an initial userMetrics object that keeps track of all of that user’s metrics.
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
* Description: Receives an event from the event bus that a driver is created so it can use that DriverReview to update that drivers metrics for their rating, number of reviews, and average rating.
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
* Description: Receives an event from the event bus that a driver  was created so that it can add that driver to the database and also create an initial driver metrics object, that keeps track of all that driver’s metrics.
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
* Description: Receives an event from the event bus that a restaurant review was created so that it can update that restaurant’s metrics for total rating, number of Reviews, and average rating.
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
* Description: Receives an event from the event bus that a restaurant was created so that it can add that user to the database and create an initial restaurantMetrics object for that restaurant to keep track of that restaurant’s metrics.
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

##### - OrderProcessed Event:
* Created/Received: Received
* Description: Receives an event from the event bus that an order has been processed. Depending on the status of the event, it will either ignore the event if it has a status of “rejected”, or with a status of “ordered” update the user and restaurant metrics for number of orders and total money spent(user), or total revenue (restaurant)
* Received From: Wallet Service
* Event Interface: 
```JS
{
    type: “OrderProcessed”
    data: {
        _id: string
        userId:string, 
        foods: Food[],
       time: string,
        status: “rejected” | “ordered”,
        type: “pickup” | “delivery”,
        driverId: string
    }
}

```

##### - OrderProcessed Event:
* Created/Received: Received
* Description: Receives an event from the event bus that an order has been completed, if the order was a delivery the metrics service will update the driver metrics such as total orders  for the driver that completed the delivery.
* Received From: Delivery Service
* Event Interface: 
```JS
{
    type: “OrderCompleted”
    data: {
       _id: string
        userId:string, 
        foods: Food[],
       time: string,
        status: “completed”,
        type: “pickup” | “delivery”,
        driverId: string
    }
}
```

### Endpoints

#### Get User Metrics
###### Description: 
This endpoint gets the metrics for a specific user from its id in the user params
###### HTTP Method: 
GET
###### Route:
"/api/metrics/uer/get/:userId"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
None
```
###### Response:
```JS
{
    _id: string,
    userId: string
    numOrders: number,
    totalPrice: number
}
```
###### Response Status:
successful: 200
user not found: 404
server error: 500

#### Get Restaurant Metrics

###### Description: 
This endpoint gets the metrics for a specific restaurant from a restaurantId in the url params
###### HTTP Method: 
GET
###### Route:
"/api/metrics/restaurant/get/:restaurantId"
###### authenticated:
This route is not authenticated
###### Body Payload:
```
None
```
###### Response:
```JS
   {
    _id: string,
    restaurantId: string,
    numOrders: number,
    totalRevenue: number,
    numReviews: number,
    totalRating: number,
    averageRating: number
   }
```
###### Response Status:
successful: 200
review not found: 404
server error: 500

#### Get Driver Metrics

###### Description: 
Gets the metrics for a specific driver from a driverId in the url params.
###### HTTP Method: 
GET
###### Route:
"/api/metrics/driver/get/:driverId"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
None
```
###### Response:
```JS
{
    _id: string,
    driverId: string,
    numDeliveries: number,
    numReviews: number,
    totalRating: number,
    averageRating: number
}

```
###### Response Status:
successful: 200
driver not found: 404
server error: 500


#### Get Popular Restaurants

###### Description: 
This endpoint gets the most popular restaurants (the restaurants that have been ordered from the most)
###### HTTP Method: 
GET
###### Route:
"/api/metrics/restaurants/popular/get"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
None
```
###### Response:
```JS
[
    _id: string,
    name: string,
    address: string,
    type: string,
    foods: Food[]
]
```
###### Response Status:
successful: 200
server error: 500
