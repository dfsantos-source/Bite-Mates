import axios from "axios";
import restaurant from "../pages/restaurant";
import React, { useEffect, useState } from 'react'

export interface review {
  _id: string,
  userId: string,
  restaurantId: string,
  content: string,
  rating: number
}

export default function Add_Review(props: any){

    const r_id = props.restaurantId
    const setReviews = props.setReviews

    const config = {headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
    const [review, setReview] = useState<{content: string, rating: number}>({content: "", rating: 0});

    const fetchReviews = async () => {
      const res = await axios.get(`http://localhost:4010/api/reviews/restaurant/get/${r_id}`);
      setReviews(res.data.reviews);
    };

    const onSubmit = async (event: any) => {
        event.preventDefault();

        const body = {
          restaurantId: r_id,
          content: review.content,
          rating: review.rating
        }

        const res = await axios.post('http://localhost:4010/api/reviews/restaurant/create',
          body, config
        )

        setReview({content: "", rating: 0})

        fetchReviews()
    }

    return (
        <div>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Content: </label>
              <input type = "text" onChange={e => setReview({...review, content: e.target.value})}
                value={review.content}
                className="form-control"
              />

              <label>Rating: </label>
              <input type="number" min = "0" max = "5" onChange={e => setReview({...review, rating: parseInt( e.target.value)})}
                value={review.rating}
                className="form-control"
              />
              
            </div>
            <button className="btn btn-primary">Submit</button>
          </form>
        </div>
      );
}