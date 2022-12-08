import { ObjectId } from "mongodb";

export interface Cart {
    _id: ObjectId,
    userId: ObjectId,
    items: CartItem[]
}

export interface CartItem {
    _id: ObjectId,
    foodId: ObjectId,
    name: string,
    price: number,
    restaurantId: ObjectId
    quantity: number
}

export interface Food {
    _id: ObjectId,
    name: string,
    price: number,
    restaurantId: ObjectId
}

export interface Restaurant {
    _id?: ObjectId,
    name: string,
    address: string,
    type: string,
    foods: Food[]
}

export interface User {
    _id?: ObjectId,
    name: string,
    address: string,
    email: string,
    doNotDisturb: boolean
}