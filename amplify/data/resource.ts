import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Post: a
    .model({
      title: a.string().required(),
      content: a.string(),
      imagePath: a.string(),
      sourceUrl: a.string(),
      redditId: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),           // ← 로그인한 사람은 모든 글 읽기 가능
      allow.publicApiKey().to(["create", "read"]), // 자동 업로드용
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