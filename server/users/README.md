# User Service 

### Person Responsible:

Name: Aayush Bhagat       
Github ID: Aayush-Bhagat

### Description: 

The user service is a service that is mainly responsible for handling the authentication for a user and also managing their data. This service allows a user to register an account and also to login to their account to show user specific information. It is also responsible for managing a user's data such as name, address, password, email etc. and also making sure that the user's information is sent to other services, so that other services can also use a user's data.

### How to run the service:

You should be running this service with the ``` docker-compose up ``` command, as it relies on the user mongodb container to run for its database. The docker compose also has environment variable secrets such as the ACCESS_TOKEN for the jsonwebtokens and the Database url to connect to the database. The service also relies on the eventbus and other services such as the review comments service, favorites service, metrics service, notifications service, cart service, wallet service, and reviews service to receive the userCreated event. To run it from scratch you will need to first ``` npm install``` then you will need to run ``` npm run build``` and then run ```npm start```, but you must have all the dependencies from above to run it from scratch without the docker-compose.

### Interactions and Events: 

##### - UserCreated Event:
* Created/Received: Created
* Description: This Event is created and sent to the event bus every time a new user is created and registers for an account on our application.
* Sent to: This event is sent to the review comments service, favorites service, metrics service, notifications service, cart service, wallet service, and reviews service.
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

### Endpoints

#### Register
###### Description: 
This endpoint is responsible for registering a user and creating an account for the user
###### HTTP Method: 
POST
###### Route:
"/api/users/register"
###### authenticated:
This route is not authenticated
###### Body Payload:
```JS
{
    name: string, 
    address: string,
    email: string,
    password: string
}
```
###### Response:
```JS
{
    user: {
        id: string,
        name: string
        address: string
        email: string
        doNotDisturb: boolean
    }
    token: string
}
```
###### Response Status:
created: 201
body not complete: 400
Server error: 500

#### Login 

###### Description: 
This endpoint is responsible for logging a user into their account
###### HTTP Method: 
POST
###### Route:
"/api/users/login"
###### authenticated:
This route is not authenticated
###### Body Payload:
```
{
    email: string,
    password: string
}
```
###### Response:
```JS
{
    user: {
        id: string,
        name: string
        address: string
        email: string
        doNotDisturb: boolean
    }
    token: string
}
```
###### Response Status:
successful: 200
body not complete: 400
User not found: 404
Server error: 500


#### Get User 

###### Description: 
This endpoint is responsible getting the current logged in users information
###### HTTP Method: 
GET
###### Route:
"/api/users/get"
###### authenticated:
This route is authenticated
###### Body Payload:
```
None
```
###### Response:
```JS
{
    user: {
        id: string,
        name: string
        address: string
        email: string
        doNotDisturb: boolean
    }
}
```
###### Response Status:
successful: 200
User not found: 404
Server error: 500

#### Update DoNotDisturb 

###### Description: 
This endpoint is responsible for updating the users doNotDisturb field so that the user can choose if they want notifications or not
###### HTTP Method: 
PUT
###### Route:
"/api/users/dnd/update"
###### authenticated:
This route is authenticated
###### Body Payload:
```JS
{
    doNotDisturb: boolean
}
```
###### Response:
```JS
{
    message: "Updated user do not disturb"
}
```
###### Response Status:
successful: 200
body incomplete: 400
User not found: 404
Server error: 500
