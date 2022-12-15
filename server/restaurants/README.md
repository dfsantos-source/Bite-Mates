
restaurants microservice

Created by: Nolan LaRochelle
Github Id: LaRochelleNolan

Description:

    This service handles all actions that are tied to restaurants and foods. The endpoints handle the creation of restaurants, as well as being able to retrieve all restaurants as well as getting a single restaurant through its id. This microservice also handles all foods, which, when created, must be tied to a restaurant. This is done to ensure that, say two diffrent restaurants had an alfredo pasta, that they are able to list the two independenelty with changes like pricing, etc.

Service Interaction:

    The service only listens for one event, that being a "OrderProcessed" event from the wallet service. It will take the objects data from the event, and check whether the status of the order is "ordered", and subsequently send a "The service also sends out an "OrderReady" status back to event bus indicating that that user's order is ready. The service also sends out a "RestaurantCreated" service out to the eventbus, with all data that is tied to that restaurant send out as well.

Endpoints:

    app.post('/api/restaurants/create')

        {name, address, type} = req.body

        - This endpoint handles the creation and placement of restaurants into its database. The service takes in a name, an address, and a type for the restaurant in a body. Upon proper error handling, the service will create a unique Id and insert it into the restaurants document within the database. It will also create a foods array, which will store all foods tied to that restaurant in that array. Upon completion, it will return a 201 with all information tied to that restaurant.

        201 - the restaurant is created
        400 - some data was missing in the body from the user.
        500 - server error

        res.status(201).send({
            message: "Restaurant successfully registered",
            _id,
            name,
            address,
            type,
            foods
        });


    app.get('/api/restaurants/get/all')
        - This endpoint handles the retrieval of all restaurants within the database. The service, upon being called, will send out an array of all restaurants.

        200 - all restaurants were successfully retrieved
        500 - server error

        res.status(200).send({restaurants});


    app.get('/api/restaurants/get/:restaurantId')

        {restaurantId} = req.params
        
        - This endpoint handles the retrieval of a restaurant and the information tied to said restaurant through its id. The sevice traverses the database to find the restaurant, and will return the info upon completion.

        200 - the specific restaurant was found and retrieved
        400 - data is missing
        404 - the restaurant wasn't found
        500 - server error

        res.status(200).send({
            _id,
            name,
            address,
            type,
            foods
        });


    app.post('/api/restaurants/foods/create')
        - This endpoint handles the creation of foods. The sevice takes in a name, price, and restaurantId in order for the event to be handled. Each food must be tied to a restaurant, as multiple different restaurants can have the same meal, but have different pricing, etc. Upon handling errors regarding missing data or no restaurants being found, the service will insert it into the database, and upon completion will return the body of the information.

        201 - the food was created
        400 - some data was missing in the body from the user.
        404 - the restaurant wasn't found
        500 - server error

        res.status(201).send({
            message: "Food successfully registered",
            _id,
            name,
            price,
            restaurantId
        })


    app.get('api/restaurants/foods/get/:restaurantId')

        {restaurantId} = req.params

        - This endpoint handles the retrieval of all foods tied to a restaurant. The service takes in a restaurantId through the parameters, and upon checking possible errors, will retrieve and send back an array of all foods that are tied to the restaurant.

        200 - the specific restaurant was found and retrieved
        400 - data was missing
        404 - the restaurant wasn't found
        500 - server error

        res.status(200).send({foods});


Tutorial:

    This service requires docker compose build && docker compose in order to properly build it after making changes. "docker compose build" builds the containers as well as builds the mongodb databases. The service, seeing as it needs to listen for an event from the wallet, requires that that service are also running for the restaurant service to be running properly.
