import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "imageBoardStorage",
  access: (allow) => ({
    "images/*": [
      allow.authenticated.to(["read", "write", "delete"]),
      allow.guest.to(["read"]),
    ],
  }),
});