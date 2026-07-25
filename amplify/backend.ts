import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { postToX } from "./functions/post-to-x/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  postToX,
});

// Function이 Storage / Data 접근 가능하도록 권한 부여
backend.storage.resources.bucket.grantRead(backend.postToX.resources.lambda);
backend.data.resources.tables["Post"].grantReadWriteData(
  backend.postToX.resources.lambda
);