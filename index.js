const { Client, Collection } = require('discord.js');
const npmFetch = require('npm-registry-fetch');

class AutoResponder {
  constructor(client, autoResponses = []) {
    if (!client || !(client instanceof Client)) {
      throw new Error('Invalid Discord.js client provided.');
    }

    this.client = client;
    this.autoResponses = new Collection();

    for (const autoResponse of autoResponses) {
      this.addAutoResponse(autoResponse.trigger, autoResponse.response);
    }

    this.client.on('messageCreate', this.handleMessage.bind(this));
    this.checkForPackageUpdate();
  }

  async checkForPackageUpdate() {
    try {
      const currentVersion = require('../package.json').version;
      const latestVersion = await npmFetch(
        `discord-autoresponder@${currentVersion}`
      ).then((res) => res.json().then((data) => data.version));

      if (currentVersion !== latestVersion) {
        console.warn(
          `A new version of discord-autoresponder is available! Please update to version ${latestVersion}.`
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleMessage(message) {
    if (message.author.bot) return;

    const triggers = Array.from(this.autoResponses.values()).filter(
      (autoResponse) =>
        new RegExp(autoResponse.trigger, 'i').test(message.content)
    );

    for (const trigger of triggers) {
      if (typeof trigger.response === 'function') {
        trigger(message).catch((error) =>
          console.error(`Error sending message "${trigger.response}":`, error)
        );
      } else {
        message.channel
          .send(trigger.response)
          .catch((error) =>
            console.error(`Error sending message "${trigger.response}":`, error)
          );
      }
    }
  }

  addAutoResponse(trigger, response) {
    if (!trigger || !response) {
      throw new Error('Trigger and response must be provided.');
    }

    if (this.autoResponses.has(trigger)) {
      throw new Error(`Auto-response with trigger ${trigger} already exists.`);
    }

    this.autoResponses.set(trigger, {
      trigger,
      response:
        typeof response === 'function' ? response : () => response.toString(),
      lastTrigger: Date.now(),
    });
  }

  removeAutoResponse(trigger) {
    if (!this.autoResponses.has(trigger)) {
      throw new Error(`Auto-response with trigger ${trigger} does not exist.`);
    }

    this.autoResponses.delete(trigger);
  }

  listAutoResponses() {
    console.log('Auto-responses:');
    this.autoResponses.forEach((value, key) =>
      console.log(`- Trigger: ${key}, Response: ${value.response.toString()}`)
    );
  }
}

module.exports = AutoResponder;
