import React from 'react'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/router';

//got navbar from bootstrap

export default function DriverNavbar() {
    const router = useRouter();

    const logout = () => {
        localStorage.clear()
        router.push("/login")
    }

    return (
        <div>
            <Navbar bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand href="#home">Navbar</Navbar.Brand>
                    <Nav style={{ color: "white" }} className="me-auto">
                        <Link className='mx-4' href="/unassignedDeliveries"> Unassigned Deliveries</Link>
                        <Link className='mx-4' href="/driverDeliveries"> My Deliveries</Link>
                    </Nav>
                </Container>
                <button onClick={logout} className='btn btn-primary'>Logout</button>
            </Navbar>
        </div>
    )
}