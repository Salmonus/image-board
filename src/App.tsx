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
        // 최신순 정렬
        setPosts([...items].sort((a, b) => 
          (b.createdAt || "").localeCompare(a.createdAt || "")
        ));
      },
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>이미지 게시판</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.signInDetails?.loginId}</span>
          <button onClick={signOut}>로그아웃</button>
        </div>
      </div>

      <hr />

      <h2>게시글 목록</h2>

      {posts.length === 0 && <p>아직 게시글이 없습니다.</p>}

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>{post.title}</h3>
          {post.content && <p>{post.content}</p>}

          {post.imagePath && (
            <PostImage path={post.imagePath} />
          )}

          {post.sourceUrl && (
            <p style={{ fontSize: 13, color: "#666" }}>
              <a href={post.sourceUrl} target="_blank" rel="noreferrer">
                원본 보기
              </a>
            </p>
          )}
        </div>
      ))}
    </main>
  );
}

// 이미지를 불러오는 별도 컴포넌트
function PostImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    getUrl({ path }).then((result) => {
      setUrl(result.url.toString());
    }).catch(console.error);
  }, [path]);

  if (!url) return <p>이미지 로딩 중...</p>;

  return (
    <img
      src={url}
      alt="게시 이미지"
      style={{ maxWidth: "100%", borderRadius: 6, marginTop: 8 }}
    />
  );
}

export default App;