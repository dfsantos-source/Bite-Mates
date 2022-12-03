import { ObjectId } from 'mongodb';
import { Restaurant } from "./types/dataTypes"

export const initRestaurants: Restaurant[] = [
    {
        _id: new ObjectId("EAC6131B4F5D34CAA897ED35"),
        name: "Garcia's",
        address: "11 Amherst Rd Amherst MA 01002",
        type: "Mexican",
        foods: [
            {
                _id: new ObjectId("8094EBB99A970B40220195A2"),
                name: "Deluxe Burrito",
                price: "$17.00",
                restaurantId: new ObjectId("EAC6131B4F5D34CAA897ED35")
            },
            {
                _id: new ObjectId("E48F90EB19EA7E6A57173B53"),
                name: "Cheese Quesadilla",
                price: "$10.00",
                restaurantId: new ObjectId("EAC6131B4F5D34CAA897ED35")
            },
            {
                _id: new ObjectId("8458598AE65A04B15E568473"),
                name: "Shrimp Tacos",
                price: "$18.00",
                restaurantId: new ObjectId("EAC6131B4F5D34CAA897ED35")
            },
            {
                _id: new ObjectId("1BA4719B09EB1B62248C8DAA"),
                name: "Burrito Bowl",
                price: "$16.00",
                restaurantId: new ObjectId("EAC6131B4F5D34CAA897ED35")
            }
        ]
    },
    {
        _id: new ObjectId("B95AC011E6D852A59F7A4EBF"),
        name: "House of Teriyaki",
        address: "29 Walloway Rd Amherst MA 01002",
        type: "Asian",
        foods: [
            {
                _id: new ObjectId("87AA95DB1CEF0DBEA8925B49"),
                name: "Chicken Fingers",
                price: "$10.00",
                restaurantId: new ObjectId("B95AC011E6D852A59F7A4EBF")
            },
            {
                _id: new ObjectId("0ABBEBC89D38B05389387159"),
                name: "Crab Rangoon",
                price: "$8.00",
                restaurantId: new ObjectId("B95AC011E6D852A59F7A4EBF")
            },
            {
                _id: new ObjectId("27FAD15D52B805E00F16A455"),
                name: "Spring Roll",
                price: "$5.00",
                restaurantId: new ObjectId("B95AC011E6D852A59F7A4EBF")
            },
            {
                _id: new ObjectId("890B8D8A3672CEB2059A4253"),
                name: "Fried Rice",
                price: "$12.00",
                restaurantId: new ObjectId("B95AC011E6D852A59F7A4EBF")
            }
        ]
    },
    {
        _id: new ObjectId("EA82D6BC3BFFBBA733EFE09F"),
        name: "Pasta E Basta",
        address: "32 Looper Rd Amherst MA 01002",
        type: "Italian",
        foods: [
            {
                _id: new ObjectId("84F16E7DE06208DBA5F94CE1"),
                name: "Fettucini Alfredo",
                price: "$14.00",
                restaurantId: new ObjectId("EA82D6BC3BFFBBA733EFE09F")
            },
            {
                _id: new ObjectId("EC41B4D3C5065A9D196D8EE5"),
                name: "Spaghetti & Meatballs",
                price: "$12.00",
                restaurantId: new ObjectId("EA82D6BC3BFFBBA733EFE09F")
            },
            {
                _id: new ObjectId("38879AC03AEE26ED8D742EBA"),
                name: "Meat Lasagna",
                price: "$13.00",
                restaurantId: new ObjectId("EA82D6BC3BFFBBA733EFE09F")
            },
            {
                _id: new ObjectId("453212BD7C6551A6DCC5557B"),
                name: "Shrimp Scampi",
                price: "$17.00",
                restaurantId: new ObjectId("EA82D6BC3BFFBBA733EFE09F")
            }
        ]
    },
    {
        _id: new ObjectId("97BDE1B7A92E519AF01F36FD"),
        name: "Bombay Royale",
        address: "4 Park St Amherst MA 01002",
        type: "Indian",
        foods: [
            {
                _id: new ObjectId("6A07DFBC471CE3BCDDCC102E"),
                name: "Vegetable Samosas",
                price: "$6.00",
                restaurantId: new ObjectId("97BDE1B7A92E519AF01F36FD")
            },
            {
                _id: new ObjectId("AF2DFA33940CEB2EB33CD970"),
                name: "Butter Chicken",
                price: "$14.00",
                restaurantId: new ObjectId("97BDE1B7A92E519AF01F36FD")
            },
            {
                _id: new ObjectId("86BE70F3D5A28C9E5600B4FD"),
                name: "Chicken Tikka Masala",
                price: "$15.00",
                restaurantId: new ObjectId("97BDE1B7A92E519AF01F36FD")
            },
            {
                _id: new ObjectId("A35B26B1383049EB09678535"),
                name: "Paneer Saag",
                price: "$13.00",
                restaurantId: new ObjectId("97BDE1B7A92E519AF01F36FD")
            }
        ]
    }
]