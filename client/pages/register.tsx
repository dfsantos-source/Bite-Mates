import React, {useState} from 'react'
interface UserRegistrationData{
    email: string,
    name: string,
    password: string,
    address?: string
}

export default function Register() {
  const [userData, setUserData] = useState<UserRegistrationData>({email: "", name: "", password: "", address: ""});

  return (
    <div>
        Register

        <form>
            <input type="text" placeholder='email'  />
            <input type="text" placeholder='name'/>
            <input type="text" placeholder='password' />
            <input type="text" placeholder='address' />
            <button className='btn-primary'>Register</button>
        </form>
    </div>
  )
}
