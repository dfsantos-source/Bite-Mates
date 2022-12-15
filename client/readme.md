# Front-End Service

Authors: 

Name: Dane Santos
Github: dfsantos-source

Name: Aayush Bhagat
Github: Aayush-Bhagat

Name: Ali Rabeea
Github: alirabeea

Name: Nolan LaRochelle
Github: LaRochelleNolan


## Description
This service is responsible for serving as the client side, frontend so users can interact with our application. This service is built using Next.js (approved by Professor) and React. All of the components for the front end are in the pages directory and components directory

## Interaction with other services
This frontend service interacts with all of the backend services except for the Notifications and Metrics Service. The frontend interacts with the backend services by making HTTP Axios asynchronous requests to the backend server, which is then relayed back to the frontend service in the form of a HTTP response. The interaction of the frontend service extends to incorporate the use of JWT auth tokens so the requests to the backend are more secure and robust.

## Frontend endpoints / routes
The frontend endpoints or routes are specific to each page. The way Next.js works is that each page in the `pages` directory acts as a route. For example, 'http:localhost:3000/login' will render the `login.tsx` page component. These frontend routes / endpoints are used to link each component page together so that the application flows from one page to the next. (ie. login -> renders restaurants page)

## How to run the service
This service can be run alongside the backend by running `docker compose`. Or, if you only want to run this individual frontend service, you can run `npm install` and `npm run dev` to get the frontend service up and running. In order to see the full integration of the application, we suggest going with the first option.
