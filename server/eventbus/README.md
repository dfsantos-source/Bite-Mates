# Event Bus Service 

### Person Responsible:

Name: Aayush Bhagat, Dane Santos, Nolan LaRochelle, Ali Rabeea     
Github ID: Aayush-Bhagat, dfsantos-source, LaRochelleNolan, alirabeea

### Description: 

The Eventbus service is responsible for being the hub of communication to all the other services in our application. It does this by receiving all of the events that any service sends out, and it will process that event and send them the the services that need them. This service allows other services to subscribe to events that they want to receive, so whenever the eventbus receives an event, it will go see which services are subscribed to those events and send the event to those services.

### How to run the service:

This service will need all the other services to be running for it to be useful.But You can run this service by running the commands ```npm install``` then ```npm run build``` and then ```npm start```. This service will run on port 4000. 

### Interactions and Events: 

The eventbus interacts with all of the services and events, as it will take in all of the events that any services sends. It will then process those events and send them to any service that has subscribed to that event.

### Endpoints

#### Events
###### Description: 
This endpoint is responsible for receiving any events that any other service sends, it will than process those events and send that eevent to any service that has subscribed to that specific event. 
###### HTTP Method: 
POST
###### Route:
"/events"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
{
    type: string,
    data:{
        data of the event
    }
}
```
###### Response:
```JS
 `sent event ${type} to subscribers`
```
###### Response Status:
successful: 200
no or incomplete body: 400
no subscribers for that event: 400

#### Subscribe
###### Description: 
This endpoint is responsible for allowing other services to subscribe to the events that they want to receive. The event bus will take the subscription and keeps track of which services want to receive which events.
###### HTTP Method: 
POST
###### Route:
"/subscribe"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
{
    eventTypes: string[],
    URL: string (url to where the service want to receive the events)
}
```
###### Response:
```JS
{
    message: "Subscribed to Events"
}
```
###### Response Status:
successful created subscription: 201
incomplete body: 400
