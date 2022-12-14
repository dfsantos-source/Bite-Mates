**Ali Rabeea**
**github.com/alirabeea**

# Pickup Service


## Description

This microservice allows customers to place an order for pickup from the restaurant. Inherently, this service functions the same as the delivery service, without the assigning of a driver. However this service marks an order ready for pickup by communicating with the restaurant service.

## Interactions (Endpoints/Events)

This service has three endpoints:

    - '/api/pickup/create'
        - This POST Method will create a pickup for a user and the food they want to order.

    - '/api/pickup/get/all/user'
        - This GET Method will return all the pickups made by a user

    - 'api/pickup/complete'
        - This PUT Method will change the status of the pickup when the user completes the order

This service also deals with 4 different events:

    - Creates 'OrderCreated' (Sends an event to other services that a pickup  has been created)
    - Receives 'OrderProcessed' (Receives an event from the event bus that an order was processed so it can add the pickup to the database)
    - Receives 'OrderReady' (Receives an event from the event bus that an order is ready so it can notify the user that the order is ready for pickup)
    - Creates 'OrderCompleted' (Creates  an event from the event bus that an order has been completed, and then notifies the user.)

## Tutorial 

To run this service, it must be run in conjuction with the Wallet, User, Driver, and Restaurant services as it requires communication between these services to fully run the endpoints and events fully. Additionally, it can be run amongst services such as notifications to create the notifications, however it is not necessary to run the Pickup service itself. There are also certain packages that need to be installed prior to running the service such as axios, cors, morgan, jsonwebtoken, express, and mongodb. Service needs to be run on port 4007, as the other services use other ports.