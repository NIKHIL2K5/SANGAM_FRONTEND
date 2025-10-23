import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext.js";
import Loading from "../components/Loading.js";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api.js";
import { toast } from "react-hot-toast";
import { useLoading } from "../context/LoadingContext.js";

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

interface CommentType {
  _id: string;
  author: any;
  content: string;
  likes?: string[];
  createdAt?: string;
}

interface AuthorType {
  _id: string;
  username: string;
  profilepic?: string;
}

interface PostType {
  _id: string;
  content: string;
  media?: string;
  author?: any;
  createdAt?: string;
  likes?: string[];
  comments?: CommentType[];
  shares?: number;
}

const Home: React.FC = () => {
  const [text, setPost] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [followPending, setFollowPending] = useState<{ [key: string]: boolean }>({})
  const [likePending, setLikePending] = useState<{ [key: string]: boolean }>({})
  const [commentLikePending, setCommentLikePending] = useState<{ [key: string]: boolean }>({})
  const [postPending, setPostPending] = useState<boolean>(false)

  const themeContext = useContext(ThemeContext) as ThemeContextType | undefined;
  const theme = themeContext?.theme ?? "light";
  const navigate = useNavigate();
  const { show, hide } = useLoading();

  useEffect(() => {
    (async () => {
      await fetchCurrentUser();
      await fetchPosts();
    })();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true)
      show("Fetching posts...")
      const response = await fetch(`${API_BASE}/server/post`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data: PostType[] = await response.json();
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false)
      hide()
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/server/user/profile`, { credentials: "include" })
      if (res.ok) {
        const user = await res.json()
        setCurrentUser(user)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handlePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim() && !file) return;
    try {
      setPostPending(true)
      show("Posting...")
      let response: Response;
      if (file) {
        const formData = new FormData();
        formData.append("content", text);
        formData.append("file", file);
        response = await fetch(`${API_BASE}/server/post`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      }
      else {
        response = await fetch(`${API_BASE}/server/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: text }),
        });
      }

      if (!response.ok) throw new Error("Failed to upload post");

      setPost("");
      setFile(null);
      toast.success("Post uploaded");
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload post");
    } finally {
      hide();
      setPostPending(false)
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    
    setLikePending(prev => ({ ...prev, [postId]: true }));
    
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    const isCurrentlyLiked = (post.likes || []).includes(currentUser._id);
    const currentLikes = post.likes || [];
    
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      
      if (isCurrentlyLiked) {
        return {
          ...p,
          likes: currentLikes.filter(id => id !== currentUser._id)
        };
      } else {
        return {
          ...p,
          likes: [...currentLikes, currentUser._id]
        };
      }
    }));

    try {
      const response = await fetch(`${API_BASE}/server/post/${postId}/like`, {
        method: "PUT",
        credentials: "include"
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error("Failed to like the post");
      }
      
      const updatedPost = await response.json();
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      
    } catch (error) {
      console.error('Like error:', error);
      // Revert optimistic update on error
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        return {
          ...p,
          likes: currentLikes
        };
      }));
      toast.error("Failed to update like");
    } finally {
      setLikePending(prev => {
        const { [postId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentText((prev) => ({ ...prev, [postId]: value }))
  }

  const handleAddComment = async (postId: string) => {
    const content = commentText[postId]?.trim()
    if (!content) return
    try {
      const res = await fetch(`${API_BASE}/server/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId, content })
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error("Failed to add comment")
      }
      const newComment: CommentType = await res.json()
      setPosts((prev) => prev.map((p) => p._id === postId ? ({ ...p, comments: [...(p.comments || []), newComment] }) : p))
      setCommentText((prev) => ({ ...prev, [postId]: "" }))
    } catch (error) {
      console.error(error)
    }
  }

  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!currentUser) return;
    
    setCommentLikePending(prev => ({ ...prev, [commentId]: true }));
    
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    const comment = (post.comments || []).find(c => c._id === commentId);
    if (!comment) return;
    
    const isCurrentlyLiked = (comment.likes || []).includes(currentUser._id);
    const currentLikes = comment.likes || [];
    
    // Optimistic update for comment like
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      
      const updatedComments = (p.comments || []).map(c => {
        if (c._id !== commentId) return c;
        
        if (isCurrentlyLiked) {
          return {
            ...c,
            likes: currentLikes.filter(id => id !== currentUser._id)
          };
        } else {
          return {
            ...c,
            likes: [...currentLikes, currentUser._id]
          };
        }
      });
      
      return { ...p, comments: updatedComments };
    }));

    try {
      const res = await fetch(`${API_BASE}/server/comment/${commentId}/like`, {
        method: "PUT",
        credentials: "include"
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error("Failed to like the comment");
      }
      
      const updatedComment: CommentType = await res.json();
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        const updatedComments = (p.comments || []).map(c => c._id === commentId ? updatedComment : c);
        return { ...p, comments: updatedComments };
      }));
      
    } catch (error) {
      console.error('Comment like error:', error);
      // Revert optimistic update on error
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        const updatedComments = (p.comments || []).map(c => {
          if (c._id !== commentId) return c;
          return { ...c, likes: currentLikes };
        });
        return { ...p, comments: updatedComments };
      }));
    } finally {
      setCommentLikePending(prev => {
        const { [commentId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleFollowToggle = async (authorId: string) => {
    setFollowPending(prev => ({ ...prev, [authorId]: true }));
    
    setCurrentUser((prev: any) => {
      if (!prev) return prev;
      const isFollowing = (prev.following || []).includes(authorId);
      const following = isFollowing
        ? prev.following.filter((id: string) => id !== authorId)
        : [...(prev.following || []), authorId];
      return { ...prev, following };
    });
    
    try {
      const res = await fetch(`${API_BASE}/server/user/${authorId}/follow`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
      const data = await res.json();
      setCurrentUser((prev: any) => (prev ? { ...prev, following: data.me.following } : prev));
    } catch (error) {
      console.error(error);
      // revert optimistic
      setCurrentUser((prev: any) => {
        if (!prev) return prev;
        const isFollowing = (prev.following || []).includes(authorId);
        const following = isFollowing
          ? prev.following.filter((id: string) => id !== authorId)
          : [...(prev.following || []), authorId];
        return { ...prev, following };
      });
    } finally {
      setFollowPending(prev => {
        const { [authorId]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <div className="mx-auto max-w-2xl px-4 py-6">      
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <form
              onSubmit={handlePost}
              className={`rounded-2xl border ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"} p-4`}
            >
              <div className="flex gap-3">
                <img
                  src={currentUser?.profilepic || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"}
                  className="h-10 w-10 rounded-full object-cover"
                  alt="me"
                />
                <div className="flex-1">
                  <textarea
                    value={text}
                    onChange={(e) => setPost(e.target.value)}
                    placeholder="Write a caption..."
                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 resize-none transition-colors ${theme === "dark" ? "bg-black text-white border-gray-800 placeholder-gray-500" : "bg-white text-gray-900 border-gray-200 placeholder-gray-400"}`}
                    rows={3}
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => setFile((e?.target?.files && (e.target.files[0] as File)))}
                      className={`block w-full text-sm file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold transition-colors sm:w-auto ${theme === "dark" ? "text-gray-300 file:bg-gray-800 file:text-gray-100 hover:file:bg-gray-700" : "text-gray-600 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"}`}
                    />
                    <button
                      type="submit"
                      disabled={postPending}
                      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${theme === "dark" ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}
                    >
                      {postPending ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Feed</h2>

            {loading ? (
              <Loading message="Fetching posts..." />
            ) : (
              <div className="space-y-6">
                {posts.map((post) => {
                  const isLiked = !!currentUser && (post.likes || []).includes(currentUser?._id);
                  return (
                    <article
                      key={post._id}
                      className={`overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}
                    >
                      <header className="flex items-center gap-3 px-4 py-3">
                        <img
                          src={post.author?.profilepic || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"}
                          alt={post.author?.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">{post.author.username}</span>
                          <span className="text-xs opacity-60">{new Date(post.createdAt || '').toLocaleString()}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          {post.author && currentUser && post.author?._id === currentUser?._id ? (
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-medium ${theme === "dark" ? "bg-black text-gray-200 border-gray-800" : "bg-gray-50 text-gray-700 border-gray-200"}`}
                            >
                              You
                            </span>
                          ) : (
                            post.author && (
                              <>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full font-semibold disabled:opacity-50 transition-colors border ${theme === "dark" ? "bg-white text-black hover:bg-gray-200 border-transparent" : "bg-black text-white hover:bg-gray-800 border-black"}`}
                                  disabled={!!followPending[post.author._id]}
                                  onClick={() => handleFollowToggle(post.author._id)}
                                >
                                  {currentUser?.following?.includes(post.author._id) ? "Unfollow" : "Follow"}
                                </button>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors border ${theme === "dark" ? "bg-yellow-400 text-black hover:bg-yellow-300 border-yellow-500" : "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"}`}
                                  onClick={() => navigate(`/chatcommunity?user=${post.author._id}&username=${encodeURIComponent(post.author.username || "")}`)}
                                  title="Message author"
                                >
                                  Message
                                </button>
                              </>
                            )
                          )}
                        </div>
                      </header>

                      {post.content && (
                        <p className={`px-4 pb-3 text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>{post.content}</p>
                      )}

                      {post.media && (
                        <div className="relative w-full bg-black/5">
                          {post.media.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video controls className="h-full w-full max-h-[70vh] object-contain bg-black">
                              <source src={post.media} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="aspect-square w-full overflow-hidden bg-black">
                              <img src={post.media} alt="media" className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="px-4 py-3">
                        <div className="flex items-center gap-6">
                          <button
                            className={`inline-flex items-center gap-2 text-sm font-medium transition ${isLiked ? "text-red-500" : theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"} ${likePending[post._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => handleLike(post._id)}
                            disabled={likePending[post._id]}
                            aria-pressed={isLiked}
                            title={isLiked ? "Unlike" : "Like"}
                          >
                            <span>❤️</span>
                            <span>{post.likes?.length || 0}</span>
                          </button>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <input
                            value={commentText[post._id] || ""}
                            onChange={(e) => handleCommentChange(post._id, e.target.value)}
                            placeholder="Add a comment..."
                            className={`flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${theme === "dark" ? "bg-black border-gray-800 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"}`}
                          />
                          <button
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${theme === "dark" ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}
                            onClick={() => handleAddComment(post._id)}
                          >
                            Post
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(post.comments || []).map((c) => {
                            const isCommentLiked = !!currentUser && (c.likes || []).includes(currentUser._id);
                            return (
                              <div key={c._id} className="flex items-start gap-3">
                                <img
                                  src={c.author?.profilepic || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"}
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <div className="text-sm">
                                    <span className="font-semibold">{c.author?.username}</span>
                                    <span className="ml-2 opacity-90">{c.content}</span>
                                  </div>
                                  <button
                                    className={`mt-1 text-xs transition ${isCommentLiked ? "text-red-500" : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"} ${commentLikePending[c._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                                    onClick={() => handleLikeComment(c._id, post._id)}
                                    disabled={commentLikePending[c._id]}
                                  >
                                    ❤️ {c.likes?.length || 0}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;