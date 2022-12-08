import { ObjectId } from "mongodb";
import type { WithId, Document } from 'mongodb'


export interface Restaurant extends WithId<Document>{
    _id: ObjectId,
    name: string,
    address: string,
    type: string,
    foods: Food[]
}

export interface Food extends WithId<Document>{
    _id: ObjectId,
    name: string,
    price: number,
    restaurantId: ObjectId
}

export interface Driver_Review extends WithId<Document>{
    _id: ObjectId,
    userId: ObjectId,
    driverId: ObjectId,
    content: string,
    rating: number
}

export interface Restaraunt_Review extends WithId<Document>{
    _id: ObjectId,
    userId: ObjectId,
    restaurantId: ObjectId,
    content: string,
    rating: number
}

export interface Driver extends WithId<Document>{
    _id: ObjectId,
    name: string,
    email: string,
    doNotDisturb: boolean
}

export interface User extends WithId<Document>{
    _id: ObjectId,
    name: string,
    email: string,
    address: string,
    doNotDisturb: boolean
}