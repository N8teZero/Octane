const mongoose = require('mongoose');

const upgradeSchema = new mongoose.Schema({
    type: { type: String, default: '' },
    level: { type: Number, default: 1 },
    stats: {
        speed: { type: Number, default: 0.0 },
        acceleration: { type: Number, default: 0.0 },
        grip: { type: Number, default: 0.0 },
        suspension: { type: Number, default: 0.0 },
        brakes: { type: Number, default: 0.0 },
        durability: { type: Number, default: 0.0 },
        aerodynamics: { type: Number, default: 0.0 },
        torque: { type: Number, default: 0.0 },
        horsepower: { type: Number, default: 0.0 }
    }
});

const statsSchema = new mongoose.Schema({
    speed: { type: Number, default: 0 },
    acceleration: { type: Number, default: 0 },
    grip: { type: Number, default: 0 },
    suspension: { type: Number, default: 0 },
    brakes: { type: Number, default: 0 },
    fuelCapacity: { type: Number, default: 0 },
    currentFuel: { type: Number, default: 0 },
    durability: { type: Number, default: 0 },
    aerodynamics: { type: Number, default: 0 },
    torque: { type: Number, default: 0 },
    horsepower: { type: Number, default: 0 },
});

const vehicleSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    level: { type: Number, default: 0 },
    year: { type: Number, default: 0 },
    make: { type: String, default: '' },
    model: { type: String, default: '' },
    image: { type: String, default: null },
    isStarterCar: { type: Boolean, default: false },
    forSale: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    upgrades: [{
        type: { type: String },
        level: { type: Number, default: 1 },
        stats: [upgradeSchema]
    }],
    stats: statsSchema
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;