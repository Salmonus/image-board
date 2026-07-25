import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postToX } from "../functions/post-to-x/resource";

const schema = a.schema({
  Post: a
    .model({
      title: a.string().required(),
      content: a.string(),
      imagePath: a.string(),
      sourceUrl: a.string(),
      redditId: a.string(),
      status: a.string().default("pending"),
      fetchedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "update"]),
      allow.guest().to(["read"]),
      allow.publicApiKey().to(["create", "read"]),
      allow.owner(),
    ]),

  publishToX: a
    .mutation()
    .arguments({
      postId: a.string().required(),
    })
    .returns(
      a.customType({
        ok: a.boolean(),
        message: a.string(),
      })
    )
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(postToX)),
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