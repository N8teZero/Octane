const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { Profile, Crew } = require('../models');
const { DateTime } = require('luxon');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crew')
        .setDescription('Manage your crew!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new crew')
                .addStringOption(option => 
                    option.setName('tag')
                    .setDescription('Tag for your crew, unique 2-4 alphanumeric characters')
                    .setRequired(true)
                    .setMaxLength(4)
                    .setMinLength(2)
                    .setAutocomplete(false))
                .addStringOption(option => option.setName('name').setDescription('Name of your crew').setRequired(true))
                .addStringOption(option => option.setName('type').setDescription('Invite only or open')
                    .setRequired(true)
                    .addChoices({ name: 'Invite', value: 'invite' }, { name: 'Open', value: 'open' })))
        .addSubcommandGroup(group =>
                    group.setName('settings')
                        .setDescription('Manage crew settings.')
                        .addSubcommand(subcommand =>
                            subcommand.setName('update')
                                .setDescription('Update crew settings.')
                                .addStringOption(option =>
                                    option.setName('name')
                                        .setDescription('Set the new name of the crew.')
                                        .setRequired(false))
                                .addStringOption(option =>
                                    option.setName('description')
                                        .setDescription('Set a new description for the crew.')
                                        .setRequired(false))
                                .addStringOption(option =>
                                    option.setName('image')
                                        .setDescription('Set a new image URL for the crew.')
                                        .setRequired(false))
                                .addBooleanOption(option =>
                                    option.setName('public')
                                        .setDescription('Set the crew visibility.')
                                        .setRequired(false))))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all crews'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join a crew')
                .addStringOption(option => option.setName('tag').setDescription('Tag of the crew you want to join').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View Crew Information')
                .addStringOption(option => option.setName('tag').setDescription('Tag of the crew you want to view')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave your current crew'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disband')
                .setDescription('Disband your crew'))
//        .addSubcommand(subcommand =>
//            subcommand
//                .setName('invite')
//                .setDescription('Invite a user to your crew')
//                .addUserOption(option => option.setName('user').setDescription('User to invite').setRequired(true)))
//                .addStringOption(option => option.setName('rank').setDescription('Set the rank for the invitee').addChoices({ name: 'Member', value: 'member' }, { name: 'Admin', value: 'admin' }))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user from your crew')
                .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('promote')
                .setDescription('Promote a user in your crew')
                .addUserOption(option => option.setName('user').setDescription('User to promote').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('demote')
                .setDescription('Demote a user in your crew')
                .addUserOption(option => option.setName('user').setDescription('User to demote').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('donate')
                .setDescription('Donate up to 500 coins a day to earn Crew Tokens')
                .addIntegerOption(option => option.setName('amount').setDescription('Amount of Coins to donate').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('Upgrade your crew to unlock higher member limits and race bonuses'))
       // .addStringOption(option => option.setName('tag').setDescription('Tag of the crew you want to view'))
    ,category : 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await createCrew(interaction);
                break;
            case 'join':
                await joinCrew(interaction);
                break;
            case 'leave':
                await leaveCrew(interaction);
                break;
            case 'list':
                await listCrews(interaction);
                break;
            case 'disband':
                await disbandCrew(interaction);
                break;
            case 'invite':
                await inviteUser(interaction);
                break;
            case 'kick':
                await kickUser(interaction);
                break;
            case 'promote':
                await promoteUser(interaction);
                break;
            case 'settings':
                await settingsCrew(interaction);
                break;
            case 'demote':
                await demoteUser(interaction);
                break;
            case 'donate':
                await donate(interaction);
                break
            case 'upgrade':
                await upgradeCrew(interaction);
                break;
            case 'info':
                await crewInfo(interaction);
                break;
            //default:
            //    await crewInfo(interaction);

        }
    }
};

async function createCrew(interaction) {
    const tag = interaction.options.getString('tag').toUpperCase();
    const name = interaction.options.getString('name');
    const type = interaction.options.getString('type');
    if (!/^[a-zA-Z0-9]{2,4}$/.test(tag)) {
        await interaction.reply({ content: "Invalid tag. The tag must be 2-4 alphanumeric characters.", ephemeral: true });
        return;
    }
    if (await Crew.findOne({ crewTag: tag })) {
        await interaction.reply({ content: "A crew with that tag already exists.", ephemeral: true });
        return;
    }

    if (name.length > 50) {
        await interaction.reply({ content: "Crew name is too long. Maximum length is 50 characters.", ephemeral: true });
        return;
    }

    if (type !== 'invite' && type !== 'open') {
        await interaction.reply({ content: "Invalid crew type. Please select invite or open.", ephemeral: true });
        return;
    }

    const crew = await Crew.createCrew(tag, name, type === 'open', interaction.user.id);
    const profile = await Profile.findOne({ userId: interaction.user.id });
    profile.crew = tag;
    await profile.save();

    await interaction.reply({ content: `Crew __**${name}**__ created with tag [${tag}].`, ephemeral: true });
}

async function joinCrew(interaction) {
    const tag = interaction.options.getString('tag').toUpperCase();
    const profile = await Profile.findOne({ userId: interaction.user.id });

    const crew = await Crew.findOne({ crewTag: tag });
    if (!crew) {
        return interaction.reply({ content: "Crew not found.", ephemeral: true });
    }

    const userCrew = await Crew.findOne({ 'members.userID': interaction.user.id });
    if (userCrew) {
        await interaction.reply({ content: "You are already in a crew.", ephemeral: true });
        return;
    }

    if (!crew.settings.public) {
        const invite = crew.invites.find(invite => invite.userID === interaction.user.id && invite.active && new Date() <= invite.expiresAt);
        if (!invite) {
            return interaction.reply({ content: "No active invite found or invite has expired.", ephemeral: true });
        }
        invite.active = false;
        crew.members.push({ userID: interaction.user.id, rank: 'member' });
        await crew.save();
        return interaction.reply({ content: `Welcome to the crew ${crew.crewName}!`, ephemeral: true });
    } else {
        if (crew.members.length >= crew.settings.memberLimit) {
            return interaction.reply({ content: "Crew member limit reached.", ephemeral: true });
        }
        crew.members.push({ userID: interaction.user.id, rank: 'member' });
    }
    profile.crew = crew.crewTag;
    await profile.save();
    await crew.save();
    await interaction.reply({ content: `Welcome to the crew ${crew.crewName}!`, ephemeral: true });
}

async function leaveCrew(interaction) {
    const profile = await Profile.findOne({ userId: interaction.user.id });
    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        await interaction.reply({ content: "You are not in a crew.", ephemeral: true });
        return;
    }

    if (crew.ownerID === interaction.user.id) {
        await interaction.reply({ content: "You cannot leave a crew you own. Disband the crew instead.", ephemeral: true });
        return;
    }

    const member = crew.members.find(m => m.userID === interaction.user.id);
    const joinDate = new Date(member.joinDate);
    now = DateTime.now().setZone('America/New_York');
    const diff = now.diff(joinDate, 'days').days;
    if (diff < 5) {
        await interaction.reply({ content: "You cannot leave a crew within 5 days of joining.", ephemeral: true });
        return;
    }

    try {
        crew.members = crew.members.filter(m => m.userID !== interaction.user.id);
        await crew.save();

        profile.crew = null;
        await profile.save();
        await interaction.reply({ content: "You have left the crew.", ephemeral: true });
    } catch (error) {
        await interaction.reply({ content: "An error occurred leaving the crew.", ephemeral: true });
    }
}

async function crewInfo(interaction) {
    let tag = interaction.options.getString('tag').toUpperCase();
    if (!tag) {
        const profile = await Profile.findOne({ userId: interaction.user.id });
        tag = profile.crew;
    }
    const crew = await Crew.findOne({ crewTag: tag });
    if (!crew) {
        await interaction.reply({ content: "Crew not found.", ephemeral: true });
        return;
    }

    const crewImage = crew.settings.customImage || 'https://i.imgur.com/3GyZt2b.png';
    const attachment = new AttachmentBuilder(crewImage, { name: 'crew.png' });
    
    let admins = '';
    const adminCount = crew.members.filter(m => m.rank === 'admin').length;
    if (adminCount === 0) {
        admins = 'None';
    } else {
        admins = crew.members.filter(m => m.rank === 'admin').map(m => `<@${m.userID}>`).join(', ');
    }
    try {
        const embed = new EmbedBuilder()
            .setColor(crew.settings.embedColor || '#00ff00')
            .setTitle(`:globe_with_meridians: [${crew.crewTag}]  ${crew.crewName}`)
            .setDescription(crew.settings.description || 'New crew!')
            //.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage('attachment://crew.png')
            .addFields(
                { name: 'Level', value: `${crew.level}/5`, inline: true },
                { name: 'Bank', value: `<:coins:1269411594685644800> ${crew.bank.toLocaleString()}`, inline: true },
                { name: 'Public', value: crew.settings.public ? 'Yes' : 'No', inline: true },
                { name: 'Members', value: `${crew.members.length} / ${crew.settings.memberLimit}`, inline: true },
                { name: 'Admins', value: admins, inline: true },
                { name: 'Owner', value: '<@'+crew.ownerID+'>', inline: true }                
            )
            .setFooter({ text: `Created: ${crew.createdDate.toLocaleDateString()} | Last Updated: ${crew.settings.lastUpdate.toLocaleDateString()}` });
    
        interaction.reply({ embeds: [embed], files: [attachment] });
    } catch (error) {
        logger.error(interaction.user.tag+' | crewInfo: '+error);
        interaction.reply('An error occurred while generating the crew profile.', { ephemeral: true });
    }

}

async function listCrews(interaction) {
    const pageLimit = 5;
    let page = 0;
    const crews = await Crew.find({ enabled: true }).sort({ 'members.length': -1 }).lean();

    function generateEmbed(start) {
        const current = crews.slice(start, start + pageLimit);
        const embed = new EmbedBuilder()
            .setTitle('Active Crews')
            .setDescription(current.map(crew => 
                `**[${crew.crewTag}]**  ${crew.crewName}\n` +
                `┣ Created: ${crew.createdDate.toLocaleDateString()} - Owned by <@${crew.ownerID}>\n` +
                `┗ Members: ${crew.members.length}`).join('\n\n'))
            .setFooter({ text: `Page ${page + 1} of ${Math.ceil(crews.length / pageLimit)}` })
            .setColor(0x00AE86);

        return embed;
    }

    const embed = generateEmbed(0);
    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    if (crews.length <= pageLimit) return;

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
            new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary)
        );
    await interaction.editReply({ embeds: [embed], components: [row] });

    const filter = i => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'next' && page < Math.ceil(crews.length / pageLimit) - 1) {
            page++;
        } else if (i.customId === 'previous' && page > 0) {
            page--;
        }

        const newEmbed = generateEmbed(page * pageLimit);
        await i.update({
            embeds: [newEmbed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                    new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(page === Math.ceil(crews.length / pageLimit) - 1)
                )
            ]
        });
    });

    collector.on('end', () => interaction.editReply({ components: [] }));
}

async function disbandCrew(interaction) {
    const profile = await Profile.findOne({ userId: interaction.user.id });
    const crew = await Crew.findOne({ crewTag: profile.crew });
    now = DateTime.now().setZone('America/New_York');
    if (!crew) {
        await interaction.reply({ content: "You are not in a crew.", ephemeral: true });
        return;
    }

    if (crew.ownerID !== interaction.user.id) {
        await interaction.reply({ content: "You are not the owner of this crew.", ephemeral: true });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Disband Crew')
        .setDescription(`Are you sure you want to disband the crew ${crew.crewName}?`)
        .setFooter({ text: 'This action cannot be undone.' });
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirmDisband')
                .setLabel('Confirm Disband')
                .setStyle(ButtonStyle.Danger)
        );
    
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = i => i.customId === 'confirmDisband' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        if (i.customId === 'confirmDisband') {
            crew.members = [];
            crew.invites = [];
            crew.enabled = false;
            crew.settings.lastUpdate = now.toJSDate();
            await crew.save();

            await Profile.updateMany({ crew: crew.crewTag }, { crew: null });
            collector.stop();
            await interaction.editReply({ content: `Crew ${crew.crewName} has been disbanded.`, components: [] });
        }
    });
}

async function inviteUser(interaction) {
    const user = interaction.options.getUser('user');
    const rank = interaction.options.getString('rank');
    const profile = await Profile.findOne({ userId: interaction.user.id });

    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (!crew.settings.public && (crew.ownerID !== interaction.user.id && !crew.members.some(m => m.userID === interaction.user.id && m.rank === 'admin'))) {
        return interaction.reply({ content: "You do not have permission to invite members.", ephemeral: true });
    }

    if (crew.invites.some(invite => invite.userID === user.id && invite.active)) {
        return interaction.reply({ content: "This user has already been invited.", ephemeral: true });
    }

    if (crew.members.length >= crew.settings.memberLimit) {
        await interaction.reply({ content: "Crew member limit reached.", ephemeral: true });
        return;
    }

    crew.invites.push({
        userID: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        rank: rank,
        active: true
    });

    await crew.save();
    await user.send(`You have been invited to join the crew ${crew.crewName} by ${interaction.user.username}. Use '/crew join ${crew.crewTag}' to accept.`);
    return interaction.reply({ content: `An invite has been sent to ${user.username}. Invite expires in 24hr.`, ephemeral: true });
}

async function kickUser(interaction) {
    const user = interaction.options.getUser('user');
    const profile = await Profile.findOne({ userId: interaction.user.id });

    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (crew.ownerID === user.id) {
        return interaction.reply({ content: "You cannot kick the crew owner.", ephemeral: true });
    }

    if (crew.ownerID !== interaction.user.id && !crew.members.some(m => m.userID === interaction.user.id && m.rank === 'admin')) {
        return interaction.reply({ content: "You do not have permission to kick members.", ephemeral: true });
    }

    if (!crew.members.some(m => m.userID === user.id)) {
        return interaction.reply({ content: "User is not in the crew.", ephemeral: true });
    }

    crew.members = crew.members.filter(m => m.userID !== user.id);
    await crew.save();
    return interaction.reply({ content: `${user.username} has been kicked from the crew.`, ephemeral: true });
}

async function promoteUser(interaction) {
    const user = interaction.options.getUser('user');
    const profile = await Profile.findOne({ userId: interaction.user.id });

    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (crew.ownerID !== interaction.user.id) {
        return interaction.reply({ content: "You do not have permission to promote members.", ephemeral: true });
    }

    if (!crew.members.some(m => m.userID === user.id)) {
        return interaction.reply({ content: "User is not in the crew.", ephemeral: true });
    }

    const member = crew.members.find(m => m.userID === user.id);
    if (member.rank === 'admin') {
        return interaction.reply({ content: "User is already an admin.", ephemeral: true });
    }

    member.rank = 'admin';
    await crew.save();
    return interaction.reply({ content: `${user.username} has been promoted to admin.`, ephemeral: true });
}

async function demoteUser(interaction) {
    const user = interaction.options.getUser('user');
    const profile = await Profile.findOne({ userId: interaction.user.id });

    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (crew.ownerID !== interaction.user.id) {
        return interaction.reply({ content: "You do not have permission to demote members.", ephemeral: true });
    }

    if (!crew.members.some(m => m.userID === user.id)) {
        return interaction.reply({ content: "User is not in the crew.", ephemeral: true });
    }

    const member = crew.members.find(m => m.userID === user.id);
    if (member.rank === 'member') {
        return interaction.reply({ content: "User is already a member.", ephemeral: true });
    }

    member.rank = 'member';
    await crew.save();
    return interaction.reply({ content: `${user.username} has been demoted to member.`, ephemeral: true });
}

async function donate(interaction) {
    const amount = interaction.options.getInteger('amount');
    if (amount < 0 || amount > 500) {
        return interaction.reply({ content: "Invalid donation amount. You can donate between 0 and 500 coins.", ephemeral: true });
    }

    const profile = await Profile.findOne({ userId: interaction.user.id });
    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (amount > profile.coins) {
        return interaction.reply({ content: "You do not have enough Coins to donate that amount.", ephemeral: true });
    }

    const lastDonated = DateTime.fromJSDate(profile.lastCrewDonation);
    const now = DateTime.now().setZone('America/New_York');
    const nextDonation = lastDonated.plus({ days: 1 }).startOf('day');

    if (now < nextDonation) {
        const timeToReset = nextDonation.diff(now).toFormat("hh 'hours', mm 'minutes'");
        return interaction.reply(`You have already donated the maximum amount today, try again in ${timeToReset}.`);
    }

    //if (amount + crew.bank > 10000) {
    //    return interaction.reply({ content: "Crew bank limit reached.", ephemeral: true });
    //}
    const maxTokens = 50;
    const crewTokens = Math.min(amount / 10, maxTokens);
    
    crew.donations.push({ userID: interaction.user.id, amount: amount, date: new Date() });
    profile.coins -= amount;
    profile.crewTokens += crewTokens;
    crew.bank += amount;
    await profile.save();
    await crew.save();
    return interaction.reply({ content: `${amount} coins donated to the crew bank.\nYou earned <:crewtoken:1269432351407083610> ${crewTokens} Crew Tokens.`, ephemeral: true });
}

async function upgradeCrew(interaction) {
    const profile = await Profile.findOne({ userId: interaction.user.id });
    const crew = await Crew.findOne({ crewTag: profile.crew });
    const upgradeCost = 10000 * crew.level;
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (crew.ownerID !== interaction.user.id) {
        return interaction.reply({ content: "You do not have permission to upgrade the crew.", ephemeral: true });
    }

    if (crew.bank < upgradeCost) {
        return interaction.reply({ content: `Crew bank must have at least <:coins:1269411594685644800> ${upgradeCost} coins to upgrade.`, ephemeral: true });
    }

    if (crew.level >= 5) {
        return interaction.reply({ content: "Crew is already at max level.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Upgrade Crew')
        .setDescription(`**Upgrade Cost**\n<:coins:1269411594685644800> ${upgradeCost.toLocaleString()} to upgrade the crew to level ${crew.level + 1}\n\nClick below to confirm.`)
        .setFooter({ text: `Crew Bank - ${crew.bank.toLocaleString()}` });

    const row = new ActionRowBuilder()
        .addComponents(
        new ButtonBuilder()
            .setCustomId('startFueling')
            .setLabel('Fueling...')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
    );

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const updatedRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('buyUpgrade')
                .setLabel('Comfirm Upgrade')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.editReply({ components: [updatedRow] });


    const filter = i => i.customId === 'buyUpgrade' && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 25000 });

    collector.on('collect', async i => {
        if (i.customId === 'buyUpgrade') {
            crew.bank -= upgradeCost;
            crew.level++;
            crew.settings.memberLimit += 5;
            await crew.save();

            const embed = new EmbedBuilder()
                .setTitle(':arrow_up: Crew Upgraded :arrow_up: ')
                .setDescription(`Crew upgraded to level ${crew.level}! Member limit increased to ${crew.settings.memberLimit}.`)
                .setColor('#FFFF00')
                .setFooter({ text: `Crew Bank - ${crew.bank}` });
            try {
                await i.update({ embeds: [embed], components: [] });
            } catch (error) {
                logger.error(interaction.user.tag+' | upgradeCrew: '+error);
            }
            collector.stop();
        }
    });
}

async function settingsCrew(interaction) {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const image = interaction.options.getString('image');
    const isPublic = interaction.options.getBoolean('public');

    const profile = await Profile.findOne({ userId: interaction.user.id });

    const crew = await Crew.findOne({ crewTag: profile.crew });
    if (!crew) {
        return interaction.reply({ content: "You are not in a crew.", ephemeral: true });
    }

    if (crew.ownerID !== interaction.user.id) {
        return interaction.reply({ content: "You do not have permission to edit crew settings.", ephemeral: true });
    }

    if (name) {
        if (name.length > 50) {
            return interaction.reply({ content: "Crew name is too long. Maximum length is 50 characters.", ephemeral: true });
        }
        if (/[^\w\s]/.test(name)) {
            return interaction.reply({ content: "Crew name contains invalid characters.", ephemeral: true });
        }
        const existingCrew = await Crew.findOne({ crewName: name });
        if (existingCrew && existingCrew.crewTag !== crew.crewTag) {
            return interaction.reply({ content: "Crew name already exists.", ephemeral: true });
        }
        try {
            crew.crewName = name;
            await crew.save();
            return interaction.reply({ content: "Crew name updated.", ephemeral: true });
        } catch (error) {
            return interaction.reply({ content: "An error occurred updating the crew name.", ephemeral: true });
        }
    }
    if (description) {
        if (description.length > 200) {
            return interaction.reply({ content: "Description is too long. Maximum length is 200 characters.", ephemeral: true });
        }
        if (/[^\w\s]/.test(description)) {
            return interaction.reply({ content: "Description contains invalid characters.", ephemeral: true });
        }
        try {
            crew.description = description;
            await crew.save();
            return interaction.reply({ content: "Crew description updated.", ephemeral: true });
        } catch (error) {
            return interaction.reply({ content: "An error occurred updating the crew description.", ephemeral: true });
        }
    }
    if (image) {
        if (!image.startsWith('http')) {
            return interaction.reply({ content: "Invalid image URL.", ephemeral: true });
        }
        try {
            crew.customImage = image;
            await crew.save();
            return interaction.reply({ content: "Crew image updated.", ephemeral: true });
        } catch (error) {
            return interaction.reply({ content: "An error occurred updating the crew image.", ephemeral: true });
        }
    }
    if (isPublic !== null) crew.settings.public = isPublic;

    await crew.save();
}