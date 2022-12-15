
favorites microservice

Created by: Nolan LaRochelle
Github Id: LaRochelleNolan

Description:

    This microservice handles the ability for users to set any restaurant as a favoirite. The user can have as many favoites as it like. The service handles returning the list with all favorited restaurants and the service will also be able to remove any restaurant from the list as well.

Service Interaction:

    The sevice listens for two different events. The first event is "UserCreated", where upon recieving the proper event type, will create a new Favorite object, which will create a unique ObjectId, take the userId, and create an empty array for restaurants to be placed into once favorited. It will also take all user information, and place it into a new users collection. The second event is "RestaurantCreated" from the restaurant service, where, upon hearing the call, will take the restaurant data from the event and insert it into the "restaurants" collection. This information will be used later to retrieve restaurant data when adding a specific restaurant to a user's favorites. The service does not send any events.

Endpoints:

    app.put('/api/user/favorites/add')

        {userId, restaurantId} = req.body;

        - This endpoint handles adding a restaurant to a user's favorites list. It takes in a userId and restaurantId and, upon making sure that both Ids exist/are valid, then the favoirtes list for that user will be retrieved, the restaurant Object given the Id will be pushed in, and the list will be updated in the collection.

        res.status(200).send({
        message: "Favorites List Successfully Updated",
            _id,
            userId,
            restaurantId,
            restaurant_list
        })

        200 - the restaurant was successfully added into the users favorites array
        400 - body was incomplete
        404 - the user nor the restaurant were found.
        500 - server error


    app.put('/api/user/favorites/delete')

        {userId, restaurantId} = req.body;

        - This endpoint handles the removal of a restaurant from a users favorites list. The enpoint will find the favorites list from the user in the colletion. Upon finding the list, the endpoint will filter out the restaurant, given that it was found in the first place.

        - A 400 reponse will occur if part of the passed in body was missing
        - A 404 reponse will occur if the user nor the restaurant were found.
        - A 200 reponse will occur if the restaurant was successfully removed from the list
        - A 500 reponse will occur from a server error

        res.status(200).send({message: "Element successfully removed"});

    app.get('/api/user/favorites/get')

        {userId} = req.body;

        - This endpoind handles the retrieval of the user's favorites list. Given a userId, and upon checking if the userID is valid/in the collection, will retrieve the restaurant list and send the list witin the response.

        400 - body was incomplete
        404 - user was not found given the userId
        200 - the list was retrieved successfully
        500 - server error

        res.status(200).send({list});

Tutorial:

    This service requires docker compose build && docker compose in order to properly build it after making changes. Docker compose build builds the containers as well as builds the mongodb databases. The service, seeing as it needs to listen for events from the user and restaurant services, requires that those services are also running for the favorites service to be running properly.
