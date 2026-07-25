import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [posts, setPosts] = useState<Schema["Post"]["type"][]>([]);

  useEffect(() => {
    const sub = client.models.Post.observeQuery().subscribe({
      next: ({ items }) => {
        setPosts(
          [...items].sort((a, b) =>
            (b.createdAt || "").localeCompare(a.createdAt || "")
          )
        );
      },
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>이미지 게시판</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14 }}>{user?.signInDetails?.loginId}</span>
          <button onClick={signOut}>로그아웃</button>
        </div>
      </div>

      <h2 style={{ marginTop: 0 }}>게시글 목록</h2>

      {posts.length === 0 && <p>아직 게시글이 없습니다.</p>}

      {posts.map((post) => (
        <article
          key={post.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            background: "#fff",
            overflow: "visible",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8, wordBreak: "break-word" }}>
            {post.title}
          </h3>

          {post.content && (
            <p
              style={{
                marginTop: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {post.content}
            </p>
          )}

          {post.imagePath && <PostImage path={post.imagePath} />}

          {post.sourceUrl && (
            <p style={{ fontSize: 13, color: "#666", marginBottom: 0 }}>
              <a href={post.sourceUrl} target="_blank" rel="noreferrer">
                원본 보기
              </a>
            </p>
          )}
        </article>
      ))}
    </main>
  );
}

function PostImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    getUrl({ path })
      .then((result) => {
        if (!cancelled) setUrl(result.url.toString());
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) return <p>이미지 로딩 중...</p>;

  return (
    <div style={{ width: "100%", overflow: "visible", margin: "12px 0" }}>
      <img
        src={url}
        alt="게시 이미지"
        style={{
          display: "block",
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          borderRadius: 8,
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default App;