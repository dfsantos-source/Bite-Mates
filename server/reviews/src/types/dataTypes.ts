import { ObjectId } from "mongodb";

export interface Driver_Review {
    _id: ObjectId,
    userId: string,
    driverId: string,
    content: string,
    rating: number
}

export interface Restaraunt_Review {
    _id: ObjectId,
    userId: string,
    restaurantId: string,
    content: string,
    rating: number
}