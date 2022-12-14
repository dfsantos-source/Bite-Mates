import React , {useState, useEffect} from 'react'
import axios from "axios";
import DeliveryCard from './DeliveryCard';

//Author: Aayush Bhagat
//Github ID: Aayush-Bhagat
export interface Delivery{
    time: string,
    userId: string,
    status: string,
    totalPrice: number,
    _id: string,
    foods: Food[]
    driverId: null | string
}

export interface Food{
    _id: string,
    name: string,
    price: number,
    restaurantId: string
}

export default function UserDeliveries() {
    const styles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        rowGap: "1em",
        columnGap: "1em",
        marginLeft: "1em"
    }

    const [deliveries, setDeliveries] = useState<Delivery[]>([]);

    useEffect(()=>{
        getUserDeliveries();
    }, [])

  const getUserDeliveries = async ()=>{
      const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      };
      try {
          const res = await axios.get("http://localhost:4001/api/delivery/get/all/user", config);
          console.log(res.data)
          setDeliveries(res.data.deliveries)
      } catch (error) {
        console.log("error")
      }
  }
  return (
      <div>
        <h2>Deliveries:</h2>
        <div className='' style={styles}>
            {deliveries.map((delivery) => (
                <div className='card px-3 py-4' key={delivery._id}>
                    <DeliveryCard delivery={delivery} />
                </div>
            ))}
        </div>
    </div>
  )
}
