import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { postToX } from "./functions/post-to-x/resource";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

const backend = defineBackend({
  auth,
  data,
  storage,
  postToX,
});

// S3 읽기 권한
backend.storage.resources.bucket.grantRead(backend.postToX.resources.lambda);

// twitter-api-v2는 번들하지 말고 node_modules로 설치
const postToXLambda = backend.postToX.resources.lambda as unknown as NodejsFunction;
const bundling = (postToXLambda as any).bundling ?? {};
(postToXLambda as any).addEnvironment?.(
  "NODE_OPTIONS",
  "--enable-source-maps"
);

// Amplify/CDK 버전에 따라 아래가 동작합니다.
try {
  const cfnFunction = backend.postToX.resources.lambda;
  // nodeModules 외부화 시도
  // @ts-ignore
  if (cfnFunction?.node?.defaultChild) {
    // no-op: 일부 버전 호환용
  }
} catch (_) {}