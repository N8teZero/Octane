const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLogger } = require('../utils/logging');
const { Profile } = require('../models');
const { DateTime } = require('luxon');

// Blessings are a way to upgrade your player and vehicle stats. They are obtained by donating 200 feast supplies. Effects include speed, acceleration, and handling boosts; player luck; and vehicle fuel efficiency.
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shrine')
        .setDescription('View and manage your player blessings.'),
    category: 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            await interaction.reply({ content: "You need to create a profile view shrine.", ephemeral: true });
            return;
        }
        
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
            //const filter = i => i.user.id === interaction.user.id && (i.customId === 'b1' || i.customId === 'b2' || i.customId === 'b3' || i.customId === 'b4' || i.customId === 'b5');
            //const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            //collector.on('collect', async i => {
            //    if (i.customId === 'b1' || i.customId === 'b2' || i.customId === 'b3' || i.customId === 'b4' || i.customId === 'b5') {
            //        const blessing = profile.blessings.find(blessing => blessing.active === true);
            //        if (!blessing) {
            //            return i.editReply({ content: 'No active blessings available.', ephemeral: true });
            //        }

            //        if (blessing.locked) {
            //                blessing.locked = false;
            //        } else {
            //            blessing.locked = true;
            //        }

            //        await profile.save();

            //        e = await generateEmbed(profile);
            //        await i.update({ embeds: [e.embed], components: e.rows, fetchReply: true });
            //    }
            //});

            //collector.on('end', async () => {
            //    e = await generateEmbed(profile);
            //    await message.edit({ embeds: [e.embed], components: [] });
            //});
        } catch (err) {
            logger.error(interaction.user.tag + ' | feast: ' + err);
            return interaction.reply('An error occurred while processing the shrine command.', { ephemeral: true });
        }
    }
};

async function generateEmbed(profile) {
    const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`Car Gods Shrine`)
        .setDescription(`**Feast Supplies:** ${[profile.feastSupplies]}\n\nSpend 200 Feast Supplies to unlock a random blessing.`);

    now = DateTime.now().setZone('America/New_York').toJSDate()
    for (let i = 0; i < profile.blessings.length; i++) {
        const blessing = profile.blessings[i];
        const bonusInfo = Object.entries(blessing.stats).map(([stat, value]) => `${stat}: ${value}`).join('\n');
        const bonusDescription = blessing.active ? `**Active:** ${blessing.type}\n**Level:** ${blessing.level}\n**Bonus:** ${bonusInfo}` : 'Inactive';
        embed.addFields({
            name: `Blessing ${i + 1}`,
            value: bonusDescription,
            inline: true
        });
    }

    const rows = [new ActionRowBuilder()];
    const collectButton = new ButtonBuilder()
        .setCustomId('getBlessing')
        .setLabel('Get Blessing')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(profile.feastSupplies < 200);

    rows[0].addComponents(collectButton);

    //if (profile.blessings[0].active) {
    //    const b1Button = new ButtonBuilder()
    //        .setCustomId('b1')
    //        .setLabel('Lock/Unlock')
    //        .setStyle(ButtonStyle.Primary)
    //        .setDisabled(false);
    //    rows[0].addComponents(b1Button);
    //}

    return { embed, rows };
}

async function generateBlessing(profile) {
    let stats = ['speed', 'acceleration', 'handling', 'luck', 'fuelEfficiency'];
    const shrineLvl = await calculateShrineLevel(profile.shrineXP);

    // Blessing Level 1: 1 stat point | % odds of getting based on shrineLvl
    // Blessing Level 2: 2 stat points | % odds of getting based on shrineLvl
    // Blessing Level 3: 5 stat points | % odds of getting based on shrineLvl
    // Blessing Level 4: 10 stat points | % odds of getting based on shrineLvl
    // Blessing Level 5: 20 stat points | % odds of getting based on shrineLvl
    // Shrine Level 1: 95% odds of getting level 1 blessing, 4% odds of getting a level 2 blessing, 1% odds of getting a level 3 blessing | 0% odds of getting level 4 or 5 blessing
    // Shrine Level 2: 85% odds of getting level 1 blessing, 10% odds of getting a level 2 blessing, 5% odds of getting a level 3 blessing | 0% odds of getting level 4 or 5 blessing
    // Shrine Level 3: 75% odds of getting level 1 blessing, 15% odds of getting a level 2 blessing, 10% odds of getting a level 3 blessing | 0% odds of getting level 4 or 5 blessing
    // Shrine Level 4: 50% odds of getting level 1 blessing, 25% odds of getting a level 2 blessing, 20% odds of getting a level 3 blessing | 5% odds of getting a level 4 blessing | 0% odds of getting a level 5 blessing
    // Shrine Level 5: 25% odds of getting level 1 blessing, 25% odds of getting a level 2 blessing, 25% odds of getting a level 3 blessing | 20% odds of getting a level 4 blessing | 5% odds of getting a level 5 blessing
    const odds = {
        1: [95, 4, 1, 0, 0],
        2: [85, 10, 5, 0, 0],
        3: [75, 15, 10, 0, 0],
        4: [50, 25, 20, 5, 0],
        5: [25, 25, 25, 20, 5]
    };
    const oddsArray = odds[shrineLvl];
    let blessing = null;
    let rand = Math.random() * 100;
    if (rand < oddsArray[0]) {
        blessing = generateBlessingStats(stats, shrineLvl);
    } else if (rand < oddsArray[0] + oddsArray[1]) {
        blessing = generateBlessingStats(stats, shrineLvl);
    } else if (rand < oddsArray[0] + oddsArray[1] + oddsArray[2]) {
        blessing = generateBlessingStats(stats, shrineLvl);
    } else if (rand < oddsArray[0] + oddsArray[1] + oddsArray[2] + oddsArray[3]) {
        blessing = generateBlessingStats(stats, shrineLvl);
    } else {
        blessing = generateBlessingStats(stats, shrineLvl);
    }
    return blessing;
}

async function calculateShrineLevel(xp) {
    let level = 0;
    if (xp >= 10000) {
        level = 5;
    } else if (xp >= 5000) {
        level = 4;
    } else if (xp >= 2500) {
        level = 3;
    } else if (xp >= 1000) {
        level = 2;
    } else if (xp >= 500) {
        level = 1;
    }
    return level;
}

function generateBlessingStats(stats, shrineLvl) {
    let blessing = {
        active: false,
        level: 1,
        type: 'Stat',
        lastUpdated: DateTime.now().setZone('America/New_York').toJSDate(),
        stats: {
            speed: 0.0,
            acceleration: 0.0,
            handling: 0.0,
            luck: 0.0,
            fuelEfficiency: 0.0
        }
    };

    let bonus = stats[Math.floor(Math.random() * stats.length)];
    let value = Math.random() * 5;
    blessing.stats[bonus] = value;
    return blessing;
}