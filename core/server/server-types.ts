export interface Route {
  // handler is function with arguments object or null
  handler: Function;
  path: string;
}

export interface UpdateEvent<Type> {
  message: Type;
  type: string;
}

export interface ChatQuestion {
  messageID?: string;
  question?: string;
  chatID: string;
}
