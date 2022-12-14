import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import Post_Reviews from './post_reviews'
import Add_Review from './add_review'

interface Restaurant {
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

export default function Single_Restaurant(props: any){
    const restaurant = props.restaurant;

    const [reviews, setReviews] = useState([]);

    const add_favorite = async (restaurantId: string) => {
        const config = {headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
        try {
            await axios.put('http://localhost:4004/api/user/favorites/add', {restaurantId}, config);
            alert('Restaurant added to favorites!')
        } catch(err) {
            console.log(err);
        }
    }

    console.log("RESTAURANT: " + restaurant.name)

    const add_to_cart = async (food_data: Food) => {
        const config = {headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
        await axios.put('http://localhost:4003/api/cart/add', {food: food_data}, config)
        alert('Item added to cart!')
    }

    const Render_Foods = ({restaurant}: {restaurant: Restaurant}) =>{
        console.log(restaurant.foods)
        if(restaurant.foods.length == 0){
            return (
                <div>
                    <h5>Foods:</h5>
                    <h6>No Foods are Available Currently</h6>
                </div>
            )
        }
        else{
            return(
                <div>
                    <h5>Foods:</h5>
                    {
                        restaurant.foods.map((f: Food) => {
                            return (
                            <div>

                                <li key = {f._id}> {f.name} {f.price} </li>
                                <button onClick = {()=>{add_to_cart(f)}}> Add to Cart </button>

                            </div>
                            )
                        })
                    }
                </div>
            )
        }
    }

    const Render_Restaurant = ({restaurant}: {restaurant: Restaurant}) => {
        return (
        <div>
            <h5>Address:</h5>
            <div>
                {restaurant.address}
            </div>
        </div>
        )
    }

    return (
        <div>
            <div> 
                <Render_Restaurant restaurant={restaurant} />
                <Render_Foods restaurant={restaurant}/>
            </div>
            <div>
                <button onClick = {()=>{add_favorite(restaurant._id)}}> Favorite </button>
            </div>
            <div>
                    <Post_Reviews restaurantId = {restaurant._id} reviews = {reviews} setReviews = {setReviews}/>
                    <h5>Add a Review:</h5>
                    <Add_Review setReviews={setReviews} restaurantId={restaurant._id} />
            </div>
        </div>
    )
}