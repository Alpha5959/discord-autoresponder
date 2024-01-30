import type { Client, Collection, Message } from 'discord.js';

type AutoResponse = {
  trigger: string;
  response: string | ((message: Message) => Promise<void>);
  lastTrigger: number;
};

declare class AutoResponder {
  private client: Client;
  private autoResponses: Collection<string, AutoResponse>;

  constructor(client: Client, autoResponses?: AutoResponse[]);

  private checkForPackageUpdate(): Promise<void>;
  private handleMessage(message: Message): void;

  addAutoResponse(
    trigger: string,
    response: string | ((message: Message) => Promise<void>)
  ): void;
  removeAutoResponse(trigger: string): void;
  listAutoResponses(): void;
}

export = AutoResponder;
