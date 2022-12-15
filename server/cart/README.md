Author: Dane Santos
<br>
Github ID: dfsantos-source

# Cart Service

## Description
The Cart Service is responsible for creating and maintaining user's carts so that they have a place to store foods that they want to order as they browse the restaurants page. The cart includes functionality to edit quantity of items as well as remove items from the cart.

## Services it communicates to
The Cart Service interacts with three other services. Those services are: User Service, Restaurant Service, and the Wallet Service. 

### 1. User Service Communication
Firstly, whenever the User Service creates a user, a "UserCreated" event is fired to our service and we add that user to our database and create a Cart for that specific user. 

### 2. Restaurant Service Communication
Secondly, the Cart Service interacts with the Restaurant Service so that whenever a restaurant is created, our service can receive a "RestaurantCreated" event so we can add that restaurant to our database, along with its respective foods, as a dependency of the cart. 

### 3. Wallet Service Communication
Thirdly, whenever an order is processed inside the Wallet Service, the Wallet Service fires an event "OrderProcessed" so that our service can clear the cart for the given user. This makes sense because our cart should be empty after the order is processed.

## Endpoints

---
### Create Cart
---
Create a cart for a user.

**URL**: `/api/cart/create`

**METHOD**: `POST`

**BODY**:

Request Data Constraints:

```json
{ "userId" : string }
```

Request Data Example:

```json
{ "userId" : "639a535d9cb50bfd8ebc1c6d" }
```

**RESPONSE**:

- `201 CREATED`: If cart is successfully created for user.

  Response Data Constraints:

  ```json
  { 
    "_id": string,
    "userId": string,
    "items": []
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639a5457c3db9331f8bd5aed",
    "userId": "238b25bfe2c0b79cf942e4c8",
    "items": []
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `400 BAD REQUEST`: If ID is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Add to cart
---
Adds a food to a user's cart. A valid user auth token must be provided

**URL**: `/api/cart/add`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints:

```json
{ 
  "userId": string,
  "food": {
    "_id": string,
    "name": string,
    "price": number,
    "restaurantId": string
  }
}
```

Request Data Example:

```json
{ 
  "userId": "63922de4e77ef8d4271d06e4",
  "food": {
    "_id": "200F505B19EA7E6A57173B53",
    "name": "Spring Rolls",
    "price": 5,
    "restaurantId": "63922de4e77ef8d4271d06e4"
  }
}
```

**RESPONSE**:

- `200 SUCCESS`: If cart successfully adds the food to the cart.

  Response Data Constraints:

  ```json
  { 
    "_id": string,
    "userId": string,
    "items": [
      {
        "_id": string,
        "name": string,
        "price": number,
        "restaurantId": string
      }
    ]
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639a5b77c3db9331f8bd5aee",
    "userId": "639a5b779cb50bfd8ebc1c6e",
    "items": [
      {
        "_id": "639a5b8ec3db9331f8bd5aef",
        "foodId": "200F505B19EA7E6A57173B53",
        "name": "Spring Rolls",
        "price": 5,
        "restaurantId": "63922de4e77ef8d4271d06e4"
        "quantity": 1
      }
    ]
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `404 NOT FOUND`: If the cart cannot be found
- `400 BAD REQUEST`: If userId is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur


---
### Remove from cart
---
Removes items from a cart based on the specific food.

**URL**: `/api/cart/remove/:cartId/:foodId`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints: 
PARAMS
```json
{
  "cartId": string,
  "foodId": string
}
```

Request Data Example: 
PARAMS
```json
{
  "cartId": "639a5b8ec3db9331f8bd5aef",
  "foodId": "200F505B19EA7E6A57173B53"
}
```

**RESPONSE**:

- `200 SUCCESS`: If cart successfully removes the items from the cart

  Response Data Constraints:

  ```json
  { 
    "_id": string,
    "userId": string,
    "items": [
      {
        "_id": string,
        "name": string,
        "price": number,
        "restaurantId": string
      }
    ]
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639a5b77c3db9331f8bd5aee",
    "userId": "639a5b779cb50bfd8ebc1c6e",
    "items": [
      {
        "_id": "639a5b8ec3db9331f8bd5aef",
        "foodId": "200f505b19ea7e6a57173b53",
        "name": "Water",
        "price": 10,
        "restaurantId": "639a5b8ec3db9331f8bd5af0",
        "quantity": 1
      }
    ]
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `404 NOT FOUND`: If the cart/item cannot be found
- `400 BAD REQUEST`: If userId or itemId is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Get cart
---
Gets a cart for a user. A valid user auth token must be provided.

**URL**: `/api/cart/get`

**METHOD**: `GET`

**BODY**:

Request Data Constraints: 
```json
{"userId": string}
```

Request Data Example: 
```json
{"userId": "639a5b779cb50bfd8ebc1c6e"}
```

**RESPONSE**:

- `200 SUCCESS`: If cart is successfully retrieved for the user

  Response Data Constraints:

  ```json
  { 
    "_id": string,
    "userId": string,
    "items": [
      {
        "_id": string,
        "name": string,
        "price": number,
        "restaurantId": string
      }
    ]
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639a5b77c3db9331f8bd5aee",
    "userId": "639a5b779cb50bfd8ebc1c6e",
    "items": [
      {
        "_id": "639a5b8ec3db9331f8bd5aef",
        "foodId": "200f505b19ea7e6a57173b53",
        "name": "Water",
        "price": 10,
        "restaurantId": "639a5b8ec3db9331f8bd5af0",
        "quantity": 1
      }
    ]
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `404 NOT FOUND`: If the cart cannot be found
- `400 BAD REQUEST`: If userId is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

---
### Edit quantity
---
Edits the quatity of a specific item in the cart.

**URL**: `/api/cart/edit/quantity/:cartId/:itemId`

**METHOD**: `PUT`

**BODY**:

Request Data Constraints: 
```json
{ 
  "quantity": number
}
```

Request Data Example:
```json
{ 
  "quantity": 5
}
```

**RESPONSE**:

- `200 SUCCESS`: If item is succssfully updated with the new quantity in the user's cart

  Response Data Constraints:

  ```json
  { 
    "_id": string,
    "userId": string,
    "items": [
      {
        "_id": string,
        "name": string,
        "price": number,
        "restaurantId": string
      }
    ]
  }
  ```

  Response Data Example:

  ```json
  {
    "_id": "639a5b77c3db9331f8bd5aee",
    "userId": "639a5b779cb50bfd8ebc1c6e",
    "items": [
      {
        "_id": "639a5b8ec3db9331f8bd5aef",
        "foodId": "200f505b19ea7e6a57173b53",
        "name": "Water",
        "price": 10,
        "restaurantId": "639a5b8ec3db9331f8bd5af0",
        "quantity": 5
      }
    ]
  }
  ```

- `400 BAD REQUEST`: If request data is incomplete
- `404 NOT FOUND`: If the cart/item cannot be found
- `400 BAD REQUEST`: If userId/itemId is not a valid Mongo UUID/ObjectID
- `500 INTERNAL SERVER ERROR`: If there is an exception or other error condition that is rare or shouldn't occur

## How to run
In order for this service to run you must run the `docker compose` command. The docker compose command will build all the docker containers for each service including the event bus and the frontend. This will also install all dependencies needed for each service and provision an independent MongoDB database respective to each service. The 4003 port is the port that this service is running on and it gets mapped to the docker container and stores a volume for the `mongodb_cart_container`. This service depends on the User Service, Restaurant Service, and the Wallet Service so they must be running in order for this service to work. Additionally, the event bus must be running, and should have succesfully subscribed to all of the events it needs prior to any API endpoints being called.
