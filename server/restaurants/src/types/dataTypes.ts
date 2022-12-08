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