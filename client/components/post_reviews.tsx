import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Post_Reviews (props: any){
    const restaurantId = props.restaurantId
    const reviews = props.reviews
    const setReviews = props.setReviews

    const fetchReviews = async () => {
        const res = await axios.get(`http://localhost:4010/api/reviews/restaurant/get/${restaurantId}`);
        setReviews(res.data.reviews);
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const Render_Reviews = ({reviews} : {reviews: any}) => {
        console.log(reviews);

        if(reviews.length == 0){
            return(
                <div>
                    <h5>Reviews:</h5>
                    <h6>No Reviews have been Posted</h6>
                </div>
            )
        }
        else{
            return(
                <div>
                    <h5>Reviews:</h5>
                    {
                        reviews.map((r: any) => {
                            return <li key={r._id}> {r.content} {r.rating} </li>
                        })
                    }
                </div>
            )
        }
    }

    return (
        <div className="d-flex flex-row flex-wrap justify-content-between">
            <Render_Reviews reviews = {reviews}/>
        </div>
    );
}