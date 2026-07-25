import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

type Post = Schema["Post"]["type"];

function formatDate(value?: string | null) {
  if (!value) return "날짜 없음";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "날짜 없음";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function App() {
  const { user, signOut } = useAuthenticator();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  async function updateStatus(post: Post, status: "approved" | "rejected") {
    if (!post.id) return;
    setLoadingId(post.id);
    try {
      await client.models.Post.update({
        id: post.id,
        status,
      });
    } catch (e) {
      console.error(e);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setLoadingId(null);
    }
  }

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

      {posts.map((post) => {
        const status = post.status || "pending";
        const displayDate = post.fetchedAt || post.createdAt;

        return (
          <article
            key={post.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0, wordBreak: "break-word" }}>
                {post.title}
              </h3>
              <span style={{ fontSize: 13, color: "#666" }}>
                {formatDate(displayDate)}
              </span>
            </div>

            <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
              상태:{" "}
              {status === "approved"
                ? "✅ 승인됨"
                : status === "rejected"
                ? "❌ 거절됨"
                : "⏳ 대기중"}
            </div>

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
              <p style={{ fontSize: 13, color: "#666" }}>
                <a href={post.sourceUrl} target="_blank" rel="noreferrer">
                  원본 보기
                </a>
              </p>
            )}

            {status === "pending" && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  onClick={() => updateStatus(post, "approved")}
                  disabled={loadingId === post.id}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#16a34a",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {loadingId === post.id ? "처리 중..." : "승인"}
                </button>
                <button
                  onClick={() => updateStatus(post, "rejected")}
                  disabled={loadingId === post.id}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#dc2626",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  거절
                </button>
              </div>
            )}
          </article>
        );
      })}
    </main>
  );
}

function PostImage({ path }: { path: string }) {
  const [url, setUrl] = useState("");

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
    <div style={{ width: "100%", margin: "12px 0" }}>
      <img
        src={url}
        alt="게시 이미지"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          borderRadius: 8,
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default App;