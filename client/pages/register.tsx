import React, {useState} from 'react'
import { useRouter } from 'next/router';
import axios from 'axios'

// AUTHOR: Aayush Bhagat
// Github Id: Aayush-Bhagat
interface UserRegistrationData{
    email: string,
    name: string,
    password: string,
    address?: string
}

export default function Register() {
  const [userData, setUserData] = useState<UserRegistrationData>({email: "", name: "", password: "", address: ""});
  const [userType, setUserType] = useState<string>("user");
  let router = useRouter();

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement> )=>{
    setUserType(event.target.value);
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>)=>{
        setUserData({...userData, [event.target.name]: event.target.value})
  }

  const registerUser = async(event: React.FormEvent<HTMLInputElement>)=>{
    event.preventDefault()
    if(userType == "user"){
        const body = {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            address: userData.address
        }
        const res = await axios.post("http://localhost:4011/api/users/register", body);
        let data = res.data;
        if (data.token) {
            localStorage.setItem("token", data.token);
            router.push("/")
        }
    }
    else if (userType === "driver"){
        const body = {
            email: userData.email,
            password: userData.password,
            name: userData.name
        }
        const res = await axios.post("http://localhost:4002/api/drivers/register", body);
        let data = res.data;
        if(data.token){
            localStorage.setItem("token", data.token);
            router.push("/")
        }
    }
  }

  return (
    <div className='d-flex w-25 flex-column'>
        <div>Register</div>
        <form>
            <div className="form-group d-flex flex-column">
                <input value={userData.email} name="email" type="text" onChange={ handleInputChange } placeholder='email' />
                <input value={userData.name} name="name" type="text" onChange={handleInputChange} placeholder='name' />
                <input value={userData.password} name="password" type="password" onChange={handleInputChange} placeholder='password' />
                  {userType === "user" ? <input value={userData.address} name="address" type="text" onChange={handleInputChange} placeholder='address' /> : null}
            </div>
            <select name="userType" defaultValue="user" onChange={handleDropdownChange} value={userType} id="">
                <option value="user">User</option>
                <option value="driver">Driver</option>
            </select>

            <button onClick={registerUser} className='btn btn-primary'>Register</button>
        </form>
    </div>
  )
}
