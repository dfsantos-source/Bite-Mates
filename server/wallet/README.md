**Ali Rabeea**
**github.com/alirabeea**

# Wallet Service


## Description

This microservice manages a customer's digital wallet, allowing them to store and process payments for their food orders. Users also have the ability to add money.

## Interactions (Endpoints/Events)

This service has two endpoints:

    - '/api/wallet/update'
        - This PUT method allows the user to add money to their balance. On success, it creates a money added event and sends it to the event-bus.

    - '/api/wallet/get'
        - This GET Method fetches a user's specific wallet from the database and returns it.

This service also deals with 4 different events:

    - Receives 'UserCreated' (To create a wallet for a newly created user and set intial balance to 100)
    - Receives 'OrderCreated' (To deduct total price from balance in order to fully place the order)
    - Creates 'OrderProcessed' (To notify other services that the amount was deducted and the order was successfully placed)
    - Creates 'MoneyAdded' (To notify other services that money was added to the user's wallet)

## Tutorial 

To run this service, it must be run in conjuction with the User and Delivery/Pickup services as it requires communication between these services to fully run the endpoints and events fully. Additionally, it can be run amongst services such as notifications to create the notifications, however it is not necessary to run the Wallet service itself. 