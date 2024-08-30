const { createLogger, format, transports } = require('winston');
const Transport = require('winston-transport');
require('winston-daily-rotate-file');
const { EmbedBuilder, WebhookClient } = require('discord.js');
const { DateTime } = require('luxon');
const { getSetting } = require('./settingsCache');

class WebhookTransport extends Transport {
    constructor(opts) {
        super(opts);
        this.errorWebhook = new WebhookClient({ url: opts.errorWebhookURL });
        this.generalWebhook = new WebhookClient({ url: opts.generalWebhookURL });
        this.buffer = [];
        this.flushInterval = 5000; // Flush every 5 seconds
        setInterval(() => this.flushBuffer(), this.flushInterval);
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        const webhook = info.level === 'error' ? this.errorWebhook : this.generalWebhook;
        this.buffer.push(info);
        callback();
    }

    flushBuffer() {
        if (this.buffer.length === 0) return;
        const groupedMessages = this.buffer.reduce((acc, msg) => {
            const now = DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd HH:mm:ss');
            const formattedMsg = `**[${msg.level.toUpperCase()}]**: \`${now} - ${msg.message}\``;
            if (!acc[msg.level]) acc[msg.level] = [];
            acc[msg.level].push(formattedMsg);
            return acc;
        }, {});

        for (const [level, messages] of Object.entries(groupedMessages)) {
            const webhook = level === 'error' ? this.errorWebhook : this.generalWebhook;
            const content = messages.join('\n');
            if (webhook) {
                webhook.send({ content }).catch(console.error);
            }
        }

        this.buffer = [];
    }
}

async function setupLogger() {
    const errorWebhookURL = await getSetting('errorWebhookURL');
    const generalWebhookURL = await getSetting('generalWebhookURL');
    const debugEnabled = await getSetting('debugLoggingEnabled');

    if (!errorWebhookURL || !generalWebhookURL) {
        console.error('Webhook URLs are undefined. Please check your settings.');
        return;
    }

    const logger = createLogger({
        level: 'debug',
        format: format.combine(
            format.timestamp(),
            format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
        transports: [
            new transports.Console(),
            new WebhookTransport({ errorWebhookURL, generalWebhookURL })
        ]
    });

    if (!debugEnabled) {
        logger.transports[0].level = 'info';
    }

    return logger;
}

let logger;

async function getLogger() {
    if (!logger) {
        logger = await setupLogger();
    }
    return logger;
}

module.exports = {
    getLogger,
    setupLogger
};