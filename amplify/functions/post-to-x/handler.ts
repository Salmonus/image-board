import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/post-to-x";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";

export const handler: Schema["publishToX"]["functionHandler"] = async (event) => {
  try {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
    Amplify.configure(resourceConfig, libraryOptions);
    const dataClient = generateClient<Schema>();

    const postId = event.arguments.postId;
    if (!postId) {
      return { ok: false, message: "postId가 없습니다." };
    }

    const { data: post, errors } = await dataClient.models.Post.get({ id: postId });
    if (errors?.length || !post) {
      return { ok: false, message: "게시글을 찾을 수 없습니다." };
    }
    if (!post.imagePath) {
      return { ok: false, message: "이미지 경로가 없습니다." };
    }

    // S3 이미지 다운로드
    const signed = await getUrl({ path: post.imagePath });
    const imageResp = await fetch(signed.url.toString());
    if (!imageResp.ok) {
      return { ok: false, message: "이미지 다운로드 실패" };
    }
    const arrayBuffer = await imageResp.arrayBuffer();
    const imageBytes = Buffer.from(arrayBuffer);
    const contentType = imageResp.headers.get("content-type") || "image/jpeg";

    // twitter-api-v2 동적 로드 (번들 문제 완화)
    const { TwitterApi } = await import("twitter-api-v2");

    const twitter = new TwitterApi({
      appKey: env.X_API_KEY,
      appSecret: env.X_API_SECRET,
      accessToken: env.X_ACCESS_TOKEN,
      accessSecret: env.X_ACCESS_TOKEN_SECRET,
    });

    const mediaId = await twitter.v1.uploadMedia(imageBytes, {
      mimeType: contentType,
    });

    await twitter.v2.tweet({
      text: " ",
      media: { media_ids: [mediaId] },
    });

    await dataClient.models.Post.update({
      id: postId,
      status: "approved",
    });

    return { ok: true, message: "X 업로드 성공" };
  } catch (e: any) {
    console.error(e);
    return {
      ok: false,
      message: e?.message ? String(e.message) : "X 업로드 중 오류",
    };
  }
};