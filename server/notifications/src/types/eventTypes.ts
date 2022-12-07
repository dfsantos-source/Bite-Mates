import { ObjectId } from "mongodb";

export interface DriverCreated {
    type: string,
    data: {
        driverId: ObjectId,
        name: string,
        email: string,
        doNotDisturb: boolean
    }
}

export interface UserCreated {
    type: string,
    data: {
        driverId: ObjectId,
        name: string,
        email: string,
        address: string,
        doNotDisturb: boolean
    }
}
