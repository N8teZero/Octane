const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLogger } = require('../utils/logging');
const { Profile } = require('../models');
const { DateTime } = require('luxon');

// Blessings are a way to upgrade your player and vehicle stats. They are obtained by donating 200 feast supplies. Effects include speed, acceleration, and handling boosts; player luck; and vehicle fuel efficiency.
// Player can only have 5 blessings at a time. Blessings can be locked/unlocked. Locked blessings cannot be changed. Blessings can be leveled up to increase their effects.
//  const blessingsSchema = new mongoose.Schema({
//      blessingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blessing' },
//      active: { type: Boolean, default: false },
//      locked: { type: Boolean, default: false },
//      level: { type: Number, default: 1 },
//      type: { type: String, default: 'Stat' },
//      lastUpdated: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
//      stats: {
//          speed: { type: Number, default: 0.0 },
//          acceleration: { type: Number, default: 0.0 },
//          handling: { type: Number, default: 0.0 },
//          luck: { type: Number, default: 0.0 },
//          fuelEfficiency: { type: Number, default: 0.0 }
//      }
//  });
//  let stats = ['speed', 'acceleration', 'handling', 'luck', 'fuelEfficiency'];
const BLESSING_CATEGORIES = {
    speed: {
        name: "Speed",
        effects: ["speed"]
    },
    acceleration: {
        name: "Acceleration",
        effects: ["acceleration"]
    },
    handling: {
        name: "Handling",
        effects: ["handling"]
    },
    leadfoot: {
        name: "Leadfoot",
        effects: ["speed", "acceleration"]
    },
    cornering: {
        name: "Cornering",
        effects: ["handling", "acceleration"]
    },
    fuelSaver: {
        name: "Fuel Saver",
        effects: ["fuelEfficiency", "speed"]
    },
    lucky: {
        name: "Lucky",
        effects: ["luck", "speed"]
    }
};

const BLESSING_LEVELS = {
    1: { multiplier: 1, effects: 1 },
    2: { multiplier: 2, effects: 1 },
    3: { multiplier: 3, effects: 1 },
    4: { multiplier: 5, effects: 1 },
    5: { multiplier: 10, effects: 2 }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shrine')
        .setDescription('View and manage your player blessings.'),
    category: 'General',
    async execute(interaction, client) {
    let logger = await getLogger();
        const profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            await interaction.reply({ content: "You need to create a profile view shrine.", ephemeral: true });
            return;
        }

        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;
            const match = interaction.customId.match(/^toggle_lock_(\d+)$/);
            if (match) {
                const index = parseInt(match[1], 10);
                const profile = await Profile.findOne({ userId: interaction.user.id });
        
                if (profile && profile.blessings && profile.blessings[index]) {
                    profile.blessings[index].locked = !profile.blessings[index].locked;
                    await profile.save();
        
                    const response = await generateEmbed(profile);
                    await interaction.update({ embeds: [response.embed], components: response.rows });
                }
            }
        });
        
        try {
            if (!profile.blessings || profile.blessings.length === 0) {
                profile.blessings = [{
                    active: false,
                    level: 1,
                    type: null,
                    lastUpdated: DateTime.now().setZone('America/New_York').toJSDate(),
                    stats: {
                        speed: 0.0,
                        acceleration: 0.0,
                        handling: 0.0,
                        luck: 0.0,
                        fuelEfficiency: 0.0
                    }
                }, {
                    active: false,
                    level: 1,
                    type: null,
                    lastUpdated: DateTime.now().setZone('America/New_York').toJSDate(),
                    stats: {
                        speed: 0.0,
                        acceleration: 0.0,
                        handling: 0.0,
                        luck: 0.0,
                        fuelEfficiency: 0.0
                    }
                }, {
                    active: false,
                    level: 1,
                    type: null,
                    lastUpdated: DateTime.now().setZone('America/New_York').toJSDate(),
                    stats: {
                        speed: 0.0,
                        acceleration: 0.0,
                        handling: 0.0,
                        luck: 0.0,
                        fuelEfficiency: 0.0
                    }
                }, {
                    active: false,
                    level: 1,
                    type: null,
                    lastUpdated: DateTime.now().setZone('America/New_York').toJSDate(),
                    stats: {
                        speed: 0.0,
                        acceleration: 0.0,
                        handling: 0.0,
                        luck: 0.0,
                        fuelEfficiency: 0.0
                    }
                }, {
                    active: false,
                    level: 1,
                    type: null,
                    lastUpdated: DateTime.now().setZone('America/New_York').toJSDate(),
                    stats: {
                        speed: 0.0,
                        acceleration: 0.0,
                        handling: 0.0,
                        luck: 0.0,
                        fuelEfficiency: 0.0
                    }
                }];
                await profile.save();
            }

            let e = await generateEmbed(profile);

            const message = await interaction.reply({ embeds: [e.embed], components: e.rows, fetchReply: true });
            const filter = i => i.user.id === interaction.user.id && (i.customId === 'b1' || i.customId === 'b2' || i.customId === 'b3' || i.customId === 'b4' || i.customId === 'b5' || i.customId === 'getBlessing');
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'getBlessing') {
                    console.log('getBlessing');
                    const blessing = await generateBlessing(profile);
                    console.log('blessing', blessing);
                    const openBlessing = profile.blessings.find(blessing => !blessing.locked);
                    if (!openBlessing) {
                        return i.editReply({ content: 'You already have 5 locked blessings. Please unlock one before getting a new one.', ephemeral: true });
                    }

                    openBlessing.active = true;
                    openBlessing.type = blessing.type;
                    openBlessing.stats = blessing.stats;
                    openBlessing.level = blessing.level;
                    openBlessing.lastUpdated = DateTime.now().setZone('America/New_York').toJSDate();
                    profile.feastSupplies -= 20;// Change to 200 when ready
                    profile.shrineXP += 5;
                    await profile.save();

                    e = await generateEmbed(profile);
                    await i.update({ embeds: [e.embed], components: e.rows, fetchReply: true });
                }
            });

            collector.on('end', async () => {
                e = await generateEmbed(profile);
                await message.edit({ embeds: [e.embed], components: [] });
            });
        } catch (err) {
            logger.error(interaction.user.tag + ' | feast: ' + err);
            return interaction.reply('An error occurred while processing the shrine command.', { ephemeral: true });
        }
    }
};

async function generateEmbed(profile) {
    const shrineLvl = await calculateShrineLevel(profile.shrineXP);
    const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`Car Gods Shrine - Level ${shrineLvl}`)
        .setDescription(`**Feast Supplies:** ${[profile.feastSupplies]}\n\nSpend 200 Feast Supplies to unlock a random blessing.`)
        .setFooter({text: 'Shrine XP: ' + profile.shrineXP});

    now = DateTime.now().setZone('America/New_York').toJSDate()
    const rows = [
        new ActionRowBuilder(), // For blessing lock/unlock buttons
        new ActionRowBuilder()  // For additional controls like "Get Blessing"
    ];

    profile.blessings.forEach((blessing, index) => {
        const lockState = blessing.locked ? '🔒' : '🔓';
        const lockLabel = blessing.locked ? 'Unlock' : 'Lock';
        const bonusInfo = Object.entries(blessing.stats)
        .filter(([stat, value]) => value > 0)
        .map(([stat, value]) => `${stat}: ${value}x`)
        .join('\n');
        const bonusDescription = blessing.active ? `**Active:** ${blessing.type}\n**Level:** ${blessing.level}\n**Bonus:** ${bonusInfo}` : 'Inactive';
        embed.addFields({
            name: `Blessing ${index + 1} (${lockState})`,
            value: bonusDescription,
            inline: true
        });

        
        const disableButton = !blessing.active; // Disable if the slot is not active
        const button = new ButtonBuilder()
            .setCustomId(`toggle_lock_${index}`)
            .setLabel(lockLabel)
            .setEmoji(lockState)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disableButton);

        if (index < 3) {
            rows[0].addComponents(button);
        } else {
            rows[1].addComponents(button);
        }
    });

    const getBlessingButton = new ButtonBuilder()
        .setCustomId('getBlessing')
        .setLabel('Get Blessing')
        .setStyle(ButtonStyle.Success)
        .setDisabled(profile.feastSupplies < 20); // Change to 200 when ready

    rows[1].addComponents(getBlessingButton);

    return { embed, rows };
}

async function calculateShrineLevel(xp) {
    let level = 1;
    if (xp >= 100000) { // 10000 / 5 = 2000 blessings
        level = 6;
    } else if (xp >= 5000) { // 5000 / 5 = 1000 blessings
        level = 5;
    } else if (xp >= 2500) { // 2500 / 5 = 500 blessings
        level = 4;
    } else if (xp >= 1000) { // 1000 / 5 = 200 blessings
        level = 3;
    } else if (xp >= 500) { // 500 / 5 = 100 blessings
        level = 2;
    }
    return level;
}

async function generateBlessing(profile) {
    const shrineLvl = await calculateShrineLevel(profile.shrineXP);
    console.log('shrineLvl', shrineLvl);
    const levelOdds = await calculateLevelOdds(shrineLvl);
    console.log('levelOdds', levelOdds);
    const blessingLevel = await pickBlessingLevel(levelOdds);
    console.log('blessingLevel', blessingLevel);
    const category = await pickRandomCategory();
    console.log('category', category);
    const stats = await assignBlessingStats(blessingLevel, category);
    return stats;
}

async function calculateLevelOdds(shrineLevel) {
    const oddsConfig = {
        0: [100, 0, 0, 0, 0],
        1: [95, 4, 1, 0, 0],
        2: [85, 10, 5, 0, 0],
        3: [75, 15, 10, 0, 0],
        4: [50, 25, 20, 5, 0],
        5: [25, 25, 25, 20, 5]
    };
    return oddsConfig[shrineLevel];
}

async function pickBlessingLevel(odds) {
    let random = Math.random() * 100;
    let sum = 0;
    for (let i = 0; i < odds.length; i++) {
        sum += odds[i];
        if (random < sum) return i + 1;
    }
    return 1;
}

async function pickRandomCategory() {
    const categories = Object.keys(BLESSING_CATEGORIES);
    const randomIndex = Math.floor(Math.random() * categories.length);
    return BLESSING_CATEGORIES[categories[randomIndex]];
}

async function assignBlessingStats(level, category) {
    const effectsToAssign = BLESSING_LEVELS[level].effects;
    const stats = {};
    for (let i = 0; i < effectsToAssign; i++) {
        const effect = category.effects[Math.floor(Math.random() * category.effects.length)];
        stats[effect] = (stats[effect] || 0) + BLESSING_LEVELS[level].multiplier;
    }
    return {
        type: category.name,
        stats: stats,
        level: level
    };
}