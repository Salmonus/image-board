import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useMemo, useState } from "react";
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

function toDateKey(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "posted":
      return "🚀 게시됨";
    case "approved":
      return "✅ 승인됨";
    case "rejected":
      return "❌ 거절됨";
    default:
      return "⏳ 대기중";
  }
}

function App() {
  const { user, signOut } = useAuthenticator();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

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

  const filteredPosts = useMemo(() => {
    if (!selectedDate) return posts;
    return posts.filter((post) => {
      const key = toDateKey(post.fetchedAt || post.createdAt);
      return key === selectedDate;
    });
  }, [posts, selectedDate]);

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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        overflow: "visible",
        background: "#f4f4f5",
        paddingTop: 24,
        paddingBottom: 40,
      }}
    >
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 16px",
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
            background: "#fff",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24 }}>이미지 게시판</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14 }}>{user?.signInDetails?.loginId}</span>
            <button onClick={signOut}>로그아웃</button>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontWeight: 600 }}>날짜 검색</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
          <button
            onClick={() => setSelectedDate("")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fafafa",
              cursor: "pointer",
            }}
          >
            전체 보기
          </button>
          <span style={{ fontSize: 13, color: "#666" }}>
            {selectedDate
              ? `${selectedDate} 게시물 ${filteredPosts.length}개`
              : `전체 게시물 ${posts.length}개`}
          </span>
        </div>

        <h2 style={{ marginTop: 0 }}>게시글 목록</h2>

        {filteredPosts.length === 0 && (
          <p>
            {selectedDate
              ? "해당 날짜의 게시물이 없습니다."
              : "아직 게시글이 없습니다."}
          </p>
        )}

        {filteredPosts.map((post) => {
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
                overflow: "visible",
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
                상태: {statusLabel(status)}
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
    </div>
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