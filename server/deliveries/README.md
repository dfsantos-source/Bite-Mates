**Ali Rabeea**
**github.com/alirabeea**

# Delivery Service


## Description

This microservice manages the process of delivering food from a restaurant to a customer's location. Its main purpose is to create a delivery order for a user, assign a driver to it, and mark it as complete once it’s been delivered.

## Interactions (Endpoints/Events)

This service has three endpoints:

    - 'api/delivery/create'
        - This POST Method will create a delivery for a user and the food they want to order.

    - '/api/delivery/get/all/user'
        - This GET Method will return all the deliveries orded by a user

    - '/api/delivery/get/all/driver'
        - This GET Method will return all the deliveries delivered by a driver

    - '/api/delivery/get/all/unassigned'
        - This GET Method will return all the deliveries that have not been assigned to a driver

    - 'api/delivery/complete'
        - This PUT Method will change the status of the delivery when the driver completes the order

    - 'api/delivery/driver/assign'
        - This PUT Method will assign a Driver to a delivery when they pick and order they want to deliver

This service also deals with 4 different events:

    - Creates 'OrderCreated' (Sends an event to other services that a delivery has been created)
    - Receives 'OrderProcessed' (Receives an event from the event bus that an order was processed so it can add the delivery to the database)
    - Receives 'OrderReady' (Receives an event from the event bus that an order is ready so it can notify the driver that the order is ready for pickup)
    - Create 'OrderCompleted' (Creates  an event from the event bus that an order has been completed, and then notifies the user.)
    - Creates 'DriverAssigned' (Creates  an event from the event bus that the driver was assigned to a delivery, so it can notify that driver)

## Tutorial 

To run this service, it must be run in conjuction with the Wallet, User, Driver, and Restaurant services as it requires communication between these services to fully run the endpoints and events fully. Additionally, it can be run amongst services such as notifications to create the notifications, however it is not necessary to run the Delivery service itself. 