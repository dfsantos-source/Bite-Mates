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
    price: string,
    restaurantId: ObjectId
}