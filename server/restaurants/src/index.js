"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express_1 = require("express");
var mongodb_1 = require("mongodb");
var initData_1 = require("./initData");
var mongodb_2 = require("mongodb");
var app = (0, express_1["default"])();
var port = 4008;
console.log(process.env.DATABASE_URL);
function connectDB() {
    return __awaiter(this, void 0, void 0, function () {
        var uri, mongo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = process.env.DATABASE_URL;
                    if (uri === undefined) {
                        throw Error('DATABASE_URL environment variable is not specified');
                    }
                    mongo = new mongodb_1.MongoClient(uri);
                    return [4 /*yield*/, mongo.connect()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Promise.resolve(mongo)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function initDB(mongo) {
    return __awaiter(this, void 0, void 0, function () {
        var db, products, result, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = mongo.db();
                    return [4 /*yield*/, db.listCollections({ name: 'restaurants' }).hasNext()];
                case 1:
                    if (_a.sent()) {
                        console.log('Collection already exists. Skipping initialization.');
                        return [2 /*return*/];
                    }
                    products = db.collection('restaurants');
                    return [4 /*yield*/, products.insertMany(initData_1.initRestaurants)];
                case 2:
                    result = _a.sent();
                    console.log("Initialized ".concat(result.insertedCount, " products"));
                    console.log("Initialized:");
                    for (key in result.insertedIds) {
                        console.log("  Inserted product with ID ".concat(result.insertedIds[key]));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var mongo;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connectDB()];
                case 1:
                    mongo = _a.sent();
                    return [4 /*yield*/, initDB(mongo)];
                case 2:
                    _a.sent();
                    app.get('/', function (req, res) {
                        res.send({ message: 'ok' });
                    });
                    //creating restaurant document
                    app.post('/api/restaurants/create', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, name, address, type, db, restaurants, _id, foods, restaurant, err_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = req.body, name = _a.name, address = _a.address, type = _a.type;
                                    if (name == null || address == null || type == null) {
                                        res.status(400).send({ message: "Body not complete" });
                                        return [2 /*return*/];
                                    }
                                    if (name == undefined || address == undefined || type == undefined) {
                                        return [2 /*return*/];
                                    }
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 3, , 4]);
                                    db = mongo.db();
                                    restaurants = db.collection('restaurants');
                                    _id = new mongodb_2.ObjectId();
                                    foods = [];
                                    restaurant = {
                                        _id: _id,
                                        name: name,
                                        address: address,
                                        type: type,
                                        foods: foods
                                    };
                                    return [4 /*yield*/, restaurants.insertOne(restaurant)];
                                case 2:
                                    _b.sent();
                                    res.status(201).send({
                                        message: "Restaurant successfully registered",
                                        _id: _id,
                                        name: name,
                                        address: address,
                                        type: type,
                                        foods: foods
                                    });
                                    return [2 /*return*/];
                                case 3:
                                    err_1 = _b.sent();
                                    res.status(500).send({ error: err_1.message });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post('/api/restaurants/foods/create', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, name, price, restaurantId, db, foods, _id, food;
                        return __generator(this, function (_b) {
                            _a = req.body, name = _a.name, price = _a.price, restaurantId = _a.restaurantId;
                            if (name == null || price == null || restaurantId == null) {
                                res.status(400).send({ message: "Body not complete" });
                                return [2 /*return*/];
                            }
                            if (!mongodb_2.ObjectId.isValid(restaurantId)) {
                                res.status(400).send({ message: "restaurantId is not a valid mongo Id" });
                                return [2 /*return*/];
                            }
                            try {
                                db = mongo.db();
                                foods = db.collection('foods');
                                _id = new mongodb_2.ObjectId();
                                food = {
                                    _id: _id,
                                    name: name,
                                    price: price,
                                    restaurantId: restaurantId
                                };
                                foods.insertOne(food);
                                res.status(201).send({
                                    message: "Food successfully registered",
                                    _id: _id,
                                    name: name,
                                    price: price,
                                    restaurantId: restaurantId
                                });
                            }
                            catch (err) {
                                res.status(500).send({ error: err.message });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    app.get('/api/restaurants/get/all', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var db, restaurants_doc, restaurants, err_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    db = mongo.db();
                                    restaurants_doc = db.collection('restaurants');
                                    return [4 /*yield*/, restaurants_doc.find().toArray()];
                                case 1:
                                    restaurants = _a.sent();
                                    if (!restaurants) {
                                        res.status(404).send({ message: "No restaurants found" });
                                        return [2 /*return*/];
                                    }
                                    res.status(201).send({ restaurants: restaurants });
                                    return [2 /*return*/];
                                case 2:
                                    err_2 = _a.sent();
                                    res.status(500).send({ error: err_2.message });
                                    return [2 /*return*/];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get('/api/restaurants/get/:restaurantId', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, db, restaurants_doc, restaurant, _id, name_1, address, type, foods, err_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    restaurantId = req.params.restaurantId;
                                    if (restaurantId == null) {
                                        res.status(400).send({ message: "Body not complete" });
                                        return [2 /*return*/];
                                    }
                                    if (!mongodb_2.ObjectId.isValid(restaurantId)) {
                                        res.status(400).send({ message: "restaurantId is not a valid mongo Id" });
                                        return [2 /*return*/];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    db = mongo.db();
                                    restaurants_doc = db.collection('restaurants');
                                    return [4 /*yield*/, restaurants_doc.findOne({ "_id": new mongodb_2.ObjectId(restaurantId) })];
                                case 2:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        res.status(404).send({ message: "Restaurant not found" });
                                        return [2 /*return*/];
                                    }
                                    _id = restaurant._id, name_1 = restaurant.name, address = restaurant.address, type = restaurant.type, foods = restaurant.foods;
                                    res.status(201).send({
                                        _id: _id,
                                        name: name_1,
                                        address: address,
                                        type: type,
                                        foods: foods
                                    });
                                    return [2 /*return*/];
                                case 3:
                                    err_3 = _a.sent();
                                    res.status(500).send({ error: err_3.message });
                                    return [2 /*return*/];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get('api/restaurants/foods/get/:restaurantId', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, db, restaurants_doc, restaurant, foods, err_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    restaurantId = req.params.restaurantId;
                                    if (restaurantId == null) {
                                        res.status(400).send({ message: "Body not complete" });
                                        return [2 /*return*/];
                                    }
                                    if (!mongodb_2.ObjectId.isValid(restaurantId)) {
                                        res.status(400).send({ message: "restaurantId is not a valid mongo Id" });
                                        return [2 /*return*/];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    db = mongo.db();
                                    restaurants_doc = db.collection('restaurants');
                                    return [4 /*yield*/, restaurants_doc.findOne({ "_id": new mongodb_2.ObjectId(restaurantId) })];
                                case 2:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        res.status(404).send({ message: "Restaurant not found" });
                                        return [2 /*return*/];
                                    }
                                    foods = restaurant.foods;
                                    res.status(201).send({ foods: foods });
                                    return [2 /*return*/];
                                case 3:
                                    err_4 = _a.sent();
                                    res.status(500).send({ error: err_4.message });
                                    return [2 /*return*/];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.listen(port, function () {
                        console.log("Running on ".concat(port, "."));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
start();
