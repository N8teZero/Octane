const { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ChannelType } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');
const { loadImage } = require('canvas');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Edit settings for your guild')
        .addBooleanOption(option => 
            option.setName('levelupmessages')
                .setDescription('Enable or disable level-up messages')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('levelupchannel')
                .setDescription('Set the channel for level-up messages')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('allowedchannels')
                .setDescription('Set the channels where commands can be used (comma-separated channel IDs)')
                .setRequired(false)),
    category: 'Misc',
    async execute(interaction) {
    let logger = await getLogger();
        const levelUpMessages = interaction.options.getBoolean('levelupmessages');
        const levelUpChannel = interaction.options.getChannel('levelupchannel');
        const allowedChannels = interaction.options.getString('allowedchannels');

        const settings = await GuildSettings.findOne({ guildId: interaction.guildId });

        if (levelUpChannel && levelUpChannel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Invalid channel type provided. Please provide a text channel.', ephemeral: true });
        }

        if (levelUpMessages !== null && levelUpMessages && !levelUpChannel) {
            return interaction.reply({ content: 'Please provide a channel for level-up messages if you want to enable them.', ephemeral: true });
        }
        
        if (allowedChannels === 0) {
            allowedChannels = '';
        }


        if (!settings) {
            const newSettings = new GuildSettings({
                guildId: interaction.guildId,
                levelupMessages: levelUpMessages ?? false,
                levelupChannel: levelUpChannel ? levelUpChannel.id : '',
                allowedChannels: allowedChannels ? allowedChannels.split(',') : []
            });
            await newSettings.save();
            interaction.reply({ content: 'Guild settings created and saved!', ephemeral: true });
        } else {
            if (levelUpMessages !== null) settings.levelupMessages = levelUpMessages;
            if (levelUpChannel) settings.levelupChannel = levelUpChannel.id;
            if (allowedChannels) settings.allowedChannels = allowedChannels.split(',');
            logger.debug(`Level-up messages: ${settings.levelupMessages}, Level-up channel: ${settings.levelupChannel}, Allowed channels: ${settings.allowedChannels}`);

            await settings.save();
            interaction.reply({ content: 'Guild settings updated successfully!', ephemeral: true });
        }
    }
};
