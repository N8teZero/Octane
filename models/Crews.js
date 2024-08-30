const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const crew = require('../commands/crew');
const { getLogger } = require('../utils/logging');


const crewSchema = new mongoose.Schema({
    crewTag: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    crewName: { type: String, required: true },
    ownerID: { type: String, required: true },
    bank: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    createdDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    settings: {
        public: { type: Boolean, default: true },
        lastUpdate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
        embedColor: { type: String, default: '#00ff00' },
        customImage: { type: String, default: 'https://i.imgur.com/tCZPGbE.png' },
        description: { type: String, default: 'New crew!' },
        memberLimit: { type: Number, default: 10 }
    },
    members: [
        {
            userID: { type: String, required: true },
            rank: { type: String, default: 'member' },
            joinDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() }
        }
    ],
    invites: [
        {
            userID: { type: String, required: true },
            createdAt: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
            expiresAt: { type: Date, default: () => DateTime.now().setZone('America/New_York').plus({ days: 1 }).toJSDate() },
            rank: { type: String, default: 'member' },
            active: { type: Boolean, default: true }
        }
    ],
    donations: [
        {
            userID: { type: String, required: true },
            amount: { type: Number, required: true },
            date: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() }
        }
    ]
});

crewSchema.statics.createCrew = async function(tag, name, public, ownerID) {
    const now = DateTime.now().setZone('America/New_York');
    let crew = await this.findOne({ crewTag: tag });
    if (!crew) {
        crew = new this({
            crewTag: tag,
            crewName: name,
            ownerID,
            settings: {
                public
            },
            members: [
                {
                    userID: ownerID,
                    rank: 'owners'
                }
            ]
        });
        
        try {
            await crew.save();
        } catch (error) {
                logger.error(ownerID+' | createCrew: '+error);
                throw error;
        }
    } else {
        throw new Error('Crew tag already exists');
    }
    return crew;
};

const Crew = mongoose.model('Crew', crewSchema);
module.exports = Crew;