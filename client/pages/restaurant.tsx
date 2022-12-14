import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Single_Restaurant from "../components/Single_Restaurant";
import { stringify } from 'querystring';

interface Restaurant{
    _id: string,
    name: string,
    address: string,
    type: string,
    foods: Food[]
}

interface Food {
    _id: string,
    name: string,
    price: number,
    restaurantId: string
}

export default function Restaurant() {
    const styles = {
        rowGap: "2em",
        columnGap: "2em",
        marginTop: "5em",
        marginLeft: "8em"
    }

    const cardStyles ={
        maxWidth: "30em",
        minWidth: "30em",
        paddingTop: "2em",
        paddingBottom: "2em"

    }
    const [restaurants, setRestaurants] = useState([]);
    const [curr_restauraunt, set_curr_restauraunt] = useState<string>("");

    const fetchRestaurants = async () => {
        const res = await axios.get('http://localhost:4008/api/restaurants/get/all');
        console.log(res.data.restaurants);
        setRestaurants(res.data.restaurants);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const RenderRestaurants = ({restaurants}: {restaurants: any}) => {
        return(
            <div style={styles} className='d-flex flex-row allign-items-center flex-wrap'>
                {
                    restaurants.map((r: Restaurant) => {
                        const foods: Food[] = r.foods
                        return (
                            <div style={cardStyles} className='card border-rounded'>
                                <div onClick = {()=>{set_curr_restauraunt(r._id)}}>
                                    <h5>Name:</h5>
                                    <div>{r.name}</div>
                                    <h5>Food Type: </h5>
                                    <div>{r.type}</div>
                                </div>
                                <div>
                                    {
                                        r._id === curr_restauraunt ? <Single_Restaurant restaurant={r} /> : null
                                    }
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    };

    return (
        <div> 
            <RenderRestaurants restaurants={restaurants}/>
        </div>
    );
}