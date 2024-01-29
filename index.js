const { Client, Collection } = require("discord.js");
const npmFetch = require("npm-registry-fetch");

class Autoresponder {
  constructor(client, autoresponses = []) {
    if (!client || !(client instanceof Client)) {
      throw new Error("Invalid Discord.js client provided.");
    }

    this.client = client;
    this.autoresponses = new Collection();

    for (const autoresponse of autoresponses) {
      this.addAutoresponse(autoresponse.trigger, autoresponse.response);
    }

    this.client.on("messageCreate", this.handleMessage.bind(this));
    this.checkForPackageUpdate();
  }

  async checkForPackageUpdate() {
    try {
      const currentVersion = require("../package.json").version;
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

    const triggers = Array.from(this.autoresponses.values()).filter(
      (autoresponse) =>
        new RegExp(autoresponse.trigger, "i").test(message.content)
    );

    for (const trigger of triggers) {
      if (typeof trigger.response === "function") {
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

  addAutoresponse(trigger, response) {
    if (!trigger || !response) {
      throw new Error("Trigger and response must be provided.");
    }

    if (this.autoresponses.has(trigger)) {
      throw new Error(`Autoresponse with trigger ${trigger} already exists.`);
    }

    this.autoresponses.set(trigger, {
      trigger,
      response:
        typeof response === "function" ? response : () => response.toString(),
      lastTrigger: Date.now(),
    });
  }

  removeAutoresponse(trigger) {
    if (!this.autoresponses.has(trigger)) {
      throw new Error(`Autoresponse with trigger ${trigger} does not exist.`);
    }

    this.autoresponses.delete(trigger);
  }

  listAutoresponses() {
    console.log("Autoresponses:");
    this.autoresponses.forEach((value, key) =>
      console.log(`- Trigger: ${key}, Response: ${value.response.toString()}`)
    );
  }
}

module.exports = Autoresponder;
