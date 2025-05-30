declare module "openai" {
  export default class OpenAI {
    constructor(options: { apiKey: string });

    chat: {
      completions: {
        create: (params: {
          model: string;
          messages: Array<{
            role: string;
            content: string;
          }>;
          response_format?: { type: string };
        }) => Promise<{
          choices: Array<{
            message: {
              content: string;
            };
          }>;
        }>;
      };
    };
  }
}
