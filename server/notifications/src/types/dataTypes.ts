import { ObjectId } from "mongodb";

export interface Driver {
    _id: ObjectId,
    name: string,
    email: string,
    doNotDisturb: boolean
}

export interface User {
    _id: ObjectId,
    name: string,
    address: string,
    email: string,
    doNotDisturb: boolean
}

export interface UserNotification {
    _id: ObjectId,
    userId: ObjectId,
    notificationMessage: string,
    isRead: boolean
}

export interface DriverNotification {
    _id: ObjectId,
    driverId: ObjectId,
    notificationMessage: string,
    isRead: boolean
}

export type TYPE_TO_MESSAGE_MAP = {
    [key: string]: string
}

export interface Food {
    _id: ObjectId,
    name: string,
    price: number,
    restaurantId: ObjectId
}

export interface Restaurant {
    _id: ObjectId,
    name: string,
    address: string,
    type: string,
    foods: Food[]
}