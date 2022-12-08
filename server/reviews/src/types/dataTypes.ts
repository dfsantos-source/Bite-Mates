import { ObjectId } from "mongodb";

export interface Driver_Review {
    _id: ObjectId,
    userId: ObjectId,
    driverId: ObjectId,
    content: string,
    rating: number
}

export interface Restaraunt_Review {
    _id: ObjectId,
    userId: ObjectId,
    restaurantId: ObjectId,
    content: string,
    rating: number
}