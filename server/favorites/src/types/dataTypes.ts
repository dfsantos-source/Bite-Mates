import { ObjectId } from "mongodb";

export interface Restaurant {
    _id: ObjectId,
    name: string,
    address: string,
    type: string,
    foods: Food[]
}

export interface Food{
    _id: ObjectId,
    name: string,
    price: number,
    restaurantId: ObjectId
}

export interface Favorites{
    _id: ObjectId,
    userId: ObjectId,
    restaurant_list: Restaurant[]
}

export interface User{
    _id: ObjectId,
    name: string,
    address: string,
    email: string,
    doNotDisturb: boolean
}