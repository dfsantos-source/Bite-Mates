import { ObjectId } from "mongodb"


export interface User {
    _id?: ObjectId,
    name: string,
    address: string,
    email: string,
    password: string
    doNotDisturb: boolean
}