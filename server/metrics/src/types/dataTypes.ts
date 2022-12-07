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

export interface User {
    _id: ObjectId,
    name: string,
    email: string,
    address: string,
    do_not_disturb: string
}

export interface Driver {

}

export interface RestaurantMetrics {
    _id?: ObjectId,
    restaurantId: ObjectId,
    numOrders: number
    totalRevenue: number
    numReviews: number,
    totalRating: number,
    averageRating: number
}

export interface UserMetrics {
    _id: ObjectId,
    userId: ObjectId,
    numOrders: number
    totalPrice: number
}

export interface DriverMetrics {
    _id: ObjectId,
    driverId: ObjectId,
    numDeliveries: number,
    numReviews: number,
    totalRating: number,
    averageRating: number
}