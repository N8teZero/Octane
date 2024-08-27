const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const { getLogger } = require('../utils/logging');

const itemPurchaseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    purchaseDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'coins' }
});

const itemSchema = new mongoose.Schema({
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    value: { type: Number, default: 0 },
    currency: { type: String, default: 'coins' },
    type: { type: String, required: true },
    description: { type: String },
    emoji: { type: String },
    enabled: { type: Boolean, default: true },
    created: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    lastUpdate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    purchases: [itemPurchaseSchema]
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;