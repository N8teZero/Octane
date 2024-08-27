const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const { getLogger } = require('../utils/logging');

const jobPositionsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    xpRequired: { type: Number, default: 0 },
    payMultiplier: { type: Number, default: 1.0 },
    enabled: { type: Boolean, default: true }
});

const jobSchema = new mongoose.Schema({
    jobTag: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    category: { type: String, required: true },
    description: { type: String },
    emoji: { type: String },
    basePay: { type: Number, required: true },
    bank: { type: Number, default: 0 },
    ownerId: {type: String, required: true},
    level: { type: Number, default: 1 },
    levelRequired: { type: Number, default: 1 },
    image: { type: String, default: 'https://i.imgur.com/tCZPGbE.png' },
    createDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    item: [
        {
            name: { type: String, required: true },
            description: { type: String },
            action: { type: String, default: 'made' },
            value: { type: Number, required: true },
            emoji: { type: String },
            quantity: { type: Number, default: 0 },
            xp: { type: Number, default: 0 }
        }
    ],
    employees: [
        {
            userID: { type: String, required: true },
            positionId: { type: String, default: null },
            joinDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
            lastWorked: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
            coinsEarned: { type: Number, default: 0 },
            coinsPerMin: { type: Number, required: true },
            xp: { type: Number, default: 0 }
        }
    ],
    positions: [jobPositionsSchema]
});

jobSchema.statics.createJob = async function(tag, name, description, category, basePay, enabled, ownerId) {
    const logger = await getLogger();
    const now = DateTime.now().setZone('America/New_York').toJSDate();
    tag = tag.toLowerCase();
    let job = await this.findOne({ jobTag: tag });
    if (!job) {

        job = new this({
            jobTag: tag,
            name,
            description,
            basePay,
            category,
            enabled,
            ownerId,
            positions: [
                { name: 'Owner', xpRequired: 0, payMultiplier: 0.0, enabled: false },
                { name: 'Employee', xpRequired: 0, payMultiplier: 1.0, enabled: true }
            ],
            employees: [
                {
                    userID: ownerId,
                    positionId: jobPositionsSchema.find(p => p.name === 'Owner').id,
                    joinDate: now,
                    lastWorked: now,
                    coinsEarned: 0,
                    coinsPerMin: basePay,
                    xp: 0
                }
            ]
        });

        try {
            await job.save();
        } catch (error) {
            logger.error(ownerId + ' | createJob: ' + error);
            throw error;
        }
    } else {
        throw new Error('Job tag already exists');
    }
    return job;
};

jobSchema.methods.addEmployee = async function(userID) {
    const logger = await getLogger();
    const employeePosition = this.positions.find(p => p.name === 'Employee').id;
    const now = DateTime.now().setZone('America/New_York').toJSDate();

    this.employees.push({
        userID: userID,
        positionId: employeePosition,
        joinDate: now,
        lastWorked: now,
        coinsEarned: 0,
        coinsPerMin: this.basePay,
        xp: 0
    });

    try {
        await this.save();
    } catch (error) {
        logger.error(userID + ' | addEmployee: ' + error);
        throw error;
    }
};

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;