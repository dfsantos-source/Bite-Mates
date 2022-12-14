import type { NextPage } from 'next'
import 'bootstrap/dist/css/bootstrap.css';
import { useRouter } from 'next/router';
import react, {useEffect} from "react"


const Home: NextPage = () => {
  
  const router = useRouter()

  useEffect(()=>{
    const token = localStorage.getItem("token")

    if (token) {
      const userType = localStorage.getItem("userType");
      if (userType === "user") {
        router.push("/restaurant")
      }
      else {
        router.push("/unassignedDeliveries")
      }
    }
    else {
      router.push("/login")
    }
  }, [])


  return (
    <div>
      Home Page
      <button className='btn btn-primary'>this button</button>

    </div>
  )
}

export default Home
