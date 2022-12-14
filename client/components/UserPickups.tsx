import React, {useEffect, useState} from 'react'
import { Food } from './UserDeliveries'
import axios from "axios"

//Author: Aayush Bhagat
//Github ID: Aayush-Bhagat


export interface Pickup {
    time: string,
    userId: string,
    status: string,
    totalPrice: number,
    _id: string,
    foods: Food[]
}


export default function UserPickups() {
    const [pickups, setPickups] = useState<Pickup[]>([]);
    const styles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        rowGap: "1em",
        columnGap: "1em",
        marginLeft: "1em"
    }

    useEffect(() => {
        getUserPickups();
    }, [])

    const getUserPickups = async () => {
        const config = {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        };
        try {
            const res = await axios.get("http://localhost:4007/api/pickup/get/all/user", config);
            console.log(res.data)
            setPickups(res.data.pickups)
        } catch (error) {
            console.log("error")
        }
    }

    const completePickup = async (pickupId: string)=>{
        const config = {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        };
        const body ={
            _id: pickupId
        }
        try {
            const res = await axios.put("http://localhost:4007/api/pickup/complete", body, config);
            getUserPickups()
        } catch (error) {
            console.log("error")
        }
    }
    return (
        <div>
            <h2>Pickups:</h2>
            <div className='' style={styles}>
                {pickups.map((pickup) => (
                    <div className='card px-3 py-4' key={pickup._id}>
                        <div>
                            <div> Pickup:</div>
                            <div>ID: {pickup._id}</div>
                            <div>STATUS: {pickup.status}</div>
                            <div> FOODS: {pickup.foods.map((food) => (
                                <div key={food._id}>
                                    <div> {food.name} </div>
                                    <div> {food.price} </div>
                                </div>
                            ))}</div>
                        </div>
                        {
                            pickup.status === "ordered" ? 
                            <button className='btn btn-danger mt-3' onClick={ () => {completePickup(pickup._id)}}> Complete Pickup</button> 
                            :
                            null
                        }
                    </div>
                ))}
            </div>
        </div>
    )

  return (
    <div>

    </div>
  )
}
