import type { NextPage } from 'next'
import 'bootstrap/dist/css/bootstrap.css';
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div>
      Home Page
      <button className='btn btn-primary'>this button</button>

    </div>
  )
}

export default Home
