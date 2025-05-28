export interface ChatMessage {
  tools?: {
    name: string;
    description: string;
    parameters: any;
    id: string;

    status?: string;
    url?: string;
  }[];

  tools_string: string;
  thinking: string;
  content: string;

  finished_thinking?: number;
  creation_time?: number;
  finish_time?: number;

  role: string;
  id: string;
}

export interface Chat {
  messages: ChatMessage[];
  id: string;
}
export class Chat {
  constructor(public messages: ChatMessage[], public id: string) {}
}
