import { ObjectId } from "mongodb";


export interface Restaurant {
    _id: ObjectId,
    name: string,
    address: string,
    type: string,
    foods: Food[]
}

export interface Food {
    _id: ObjectId,
    name: string,
    price: number,
    restaurantId: ObjectId
}

export interface RestaurantComment {
    _id: ObjectId,
    restaurantId: ObjectId,
    content: string,
    reviewId: ObjectId,
    userId: ObjectId
}

export interface RestaurantCommentData {
    _id: string,
    restaurantId: string,
    content: string,
    reviewId: string,
    userId: string
}

export interface DriverComment {
    _id: ObjectId,
    driverId: ObjectId,
    content: string,
    reviewId: ObjectId,
    userId: ObjectId
}

export interface DriverCommentData {
    _id: string,
    driverId: string,
    content: string,
    reviewId: string,
    userId: string
}

export interface User {
    _id: ObjectId,
    email: string,
    name: string,
    address: string,
    do_not_disturb: boolean
}

export interface DriverReview {
    _id: ObjectId,
    userId: ObjectId,
    driverId: ObjectId,
    content: string,
    rating: number
}

export interface RestaurantReview {
    _id: ObjectId,
    userId: ObjectId,
    restaurantId: ObjectId,
    content: string,
    rating: number
}