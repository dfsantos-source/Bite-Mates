import { ObjectId } from "mongodb"
export interface UserCreatedEvent {
    type: "UserCreated",
    data: {
        _id: ObjectId
        email: string,
        name: string,
        address: string,
        doNotDisturb: boolean
    }
}