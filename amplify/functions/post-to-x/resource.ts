import { defineFunction, secret } from "@aws-amplify/backend";

export const postToX = defineFunction({
  name: "post-to-x",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    X_API_KEY: secret("X_API_KEY"),
    X_API_SECRET: secret("X_API_SECRET"),
    X_ACCESS_TOKEN: secret("X_ACCESS_TOKEN"),
    X_ACCESS_TOKEN_SECRET: secret("X_ACCESS_TOKEN_SECRET"),
  },
});