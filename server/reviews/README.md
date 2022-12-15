
reviews microservice

created by: Nolan LaRochelle 
Github: LaRochelleNolan

Description:

    This microservice handles everything related to the reviews that users can possibly give within our appliaction. The service handles two different types of reviews: those being for restaurants and drivers. Users are able to create reviews, with both a content body where they can write their thoughts on the food, as well as give it a star rating from one to five. The service also handles the retrieval of the different reviews, given either a restaurantId or driverId, where the service will traverse their respective documents to send back all the reviews tied to either that driver or restaurant. Both are handled within the same mongoDB collection.

Service Interaction:

    Through the events endpoint, the service is listening for a number of different calls: those being "UserCreated", "RestaurantCreated", and "DriverCreated". Dependenet on which event is heard, the service will take the data, and store each different event type within their own document. This information is a necessity for the endpoints within the service.In return, the service will also send out "DriverReviewCreated" and "RestaurantReviewCreated" events, after the creation and insertion of the reviews into their respective documents. These events including the metrics service and review comment service.

EndPoints:

    app.post('/api/reviews/driver/create')

        - This endpoint handles the creation of a driver review. The endpoint will take in the data listed below 
        { userId, restaurantId, content, rating }

        - With this information, the endpoint will create a new _id , and create a driverReview object to be inserted into the mongo db collection tied to driverReviews.

        - The endpoint will respond with a 201 if the process of inserting the object into the document went successfully.
        - If the endpoint is missing any of the data, it will respond with a 400.
        - If the user or the driver don't exist, then the endpoint will respond with a 404.
        - A 500 error will occur upon a server error

        res.status(201).send({
        message: "Review successfully registered",
            _id,
            userId,
            driverId,
            content,
            rating
        });


    app.get('/api/reviews/driver/get/:driverId')

        - This endpoint hanldes the retrieval of the reviews from a specific driver. The endpoint will take in a driverId from the  paramaters, where it will traverse the driverReview document for the driverId, and return all reviews that are tied to that driver.

        - The user will recieve a 200 status, with an array of all driverReview objects.
        - If the endpoint is missing any of the data, it will respond with a 400.
        - If the driver doesn't exists given the driverId, the endpoint will respond with a 404
        - A 500 error will occur upon a server error

        res.status(200).send({reviews});


    app.post('/api/reviews/restaurant/create')

        - This endpoint handles the creation of a review for a specific restaurant.
        The data { userId, driverId, content, rating} is taken in from the body.

        - With this information, the endpoint will create a new _id , and create a restaurantReview object to be inserted into the mongo db collection tied to driverReviews.

        - The endpoint will respond with a 201 if the process of inserting the object into the document went successfully.
        - If the endpoint is missing any of the data, it will respond with a 400.
        - If the user or the restaurant don't exist, then the endpoint will respond with a 404.
        - A 500 error will occur upon a server error

        res.status(201).send({
            message: "Review successfully registered",
            _id,
            userId,
            restaurantId,
            content,
            rating
        });


    app.get('/api/reviews/restaurant/get/:restaurantId')

        - This endpoint handles the retrieval of the reviews from a specific restaurant. The endpoint will take in a restaurantId from the URL paramater. The endpoint will traverse the restaurantReview, and send back a 200 status with an array of all reviews that are tied to that restaurant.

        - If no restaurantId is give, the endpoint will respond with a 400
        - If the restaurant doesn't exist given the restaurantId, then the endpoint will respond with a 404
        - A 500 error will occur upon a server error

        res.status(200).send({reviews});


Tutorial: