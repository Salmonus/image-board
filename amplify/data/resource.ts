import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Post: a
    .model({
      title: a.string().required(),
      content: a.string(),
      imagePath: a.string(),
      sourceUrl: a.string(),
      redditId: a.string(),
      status: a.string().default("pending"), // pending | approved | rejected
      fetchedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "update"]),
      allow.guest().to(["read"]),
      allow.publicApiKey().to(["create", "read"]),
      allow.owner(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});