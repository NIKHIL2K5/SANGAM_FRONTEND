import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../context/ThemeContext.js";
import { API_BASE } from "../lib/api.js";

type UserType = {
  _id: string;
  username: string;
  email?: string;
  profilePicture?: string;
  followers?: string[];
  following?: string[];
};

type PostType = {
  _id: string;
  content: string;
  media?: string | null;
  author?: any;
  createdAt?: string;
  likes?: string[];
  comments?: Array<{ _id: string }>;
  shares?: number;
};

function Profile() {
  const themeContext = useContext(ThemeContext);
  const theme =
    themeContext && typeof themeContext === "object" && themeContext !== null && "theme" in themeContext
      ? (themeContext as { theme: string }).theme
      : "light";

  const [me, setMe] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [meRes, postsRes] = await Promise.all([
          fetch(`${API_BASE}/server/user/profile`, { credentials: "include" }),
          fetch(`${API_BASE}/server/post`, { credentials: "include" }),
        ]);
        if (meRes.ok) {
          const meJson = await meRes.json();
          setMe(meJson);
        }
        if (postsRes.ok) {
          const postsJson: PostType[] = await postsRes.json();
          setPosts(postsJson);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const myPosts = useMemo(() => {
    if (!me) return [] as PostType[];
    return posts.filter((p) => p.author?._id === me._id);
  }, [me, posts]);

  const avatar = me?.profilePicture || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg";

  const handleSupport = async() => {
    try{
      const amount=5
      const to=me?._id
      const response=await fetch(`${API_BASE}/server/payment/create-checkout-session`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        credentials:"include",
        body:JSON.stringify({amount,to})
      })
      const data=await response.json()
      if (data.url){
        window.location.href=data.url
      }else{
        alert("Failed to initiate payment, Try Again.")
      }
    }
    catch(error){
      alert("Failed to initiate payment, Try Again.")
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >

      <div
        className={`relative h-48 sm:h-56 md:h-64 ${
          theme === "dark"
            ? "bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-400"
            : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400"
        }`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_40%)]" />
      </div>

      
      <div className="max-w-5xl mx-auto px-4 -mt-16 sm:-mt-20 md:-mt-24">
        <div
          className={`rounded-2xl shadow-xl border ${
            theme === "dark" ? "bg-gray-900/80 border-gray-800" : "bg-white border-gray-200"
          } backdrop-blur supports-[backdrop-filter]:bg-opacity-80`}
        >
          <div className="p-6 sm:p-8 relative">
            <div className="flex items-end sm:items-center gap-4 sm:gap-6">
              <img
                src={avatar}
                alt="avatar"
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 ${
                  theme === "dark" ? "border-gray-800" : "border-white"
                } -mt-16 sm:-mt-20 shadow-lg`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {me?.username || "Your Profile"}
                  </h1>
                  {me?.email && (
                    <span className={`text-xs px-2 py-1 rounded-full ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                      {me.email}
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Welcome to your space. Share your thoughts, media, and connect with others.
                </p>
              </div>

              <button className={`text-white px-4 py-2 rounded ${theme === "dark" ? "bg-yellow-600" : "bg-blue-600"}`} onClick={handleSupport}>Support This Creator</button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg">
              <div className={`rounded-xl px-4 py-3 sm:py-4 text-center border ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                <div className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Posts</div>
                <div className="text-xl sm:text-2xl font-bolxd">{myPosts.length}</div>
              </div>
              <div className={`rounded-xl px-4 py-3 sm:py-4 text-center border ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                <div className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Followers</div>
                <div className="text-xl sm:text-2xl font-bold">{me?.followers?.length ?? 0}</div>
              </div>
              <div className={`rounded-xl px-4 py-3 sm:py-4 text-center border ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                <div className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Following</div>
                <div className="text-xl sm:text-2xl font-bold">{me?.following?.length ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className={theme === "dark" ? "border-t border-gray-800" : "border-t border-gray-200"} />

          {/* Posts */}
          <div className="p-6 sm:p-8">
            <h2 className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 ${theme === "dark" ? "text-yellow-400" : "text-blue-700"}`}>
              Your Posts
            </h2>

            {loading ? (
              <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Loading your profile...</div>
            ) : myPosts.length === 0 ? (
              <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>You haven't posted yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {myPosts.map((post) => (
                  <div
                    key={post._id}
                    className={`rounded-xl border shadow-sm overflow-hidden ${
                      theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="p-4">
                      <div className={`text-xs mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Just now"}
                      </div>
                      {post.content && (
                        <div className={`whitespace-pre-wrap leading-relaxed ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>{post.content}</div>
                      )}
                    </div>
                    {post.media && (
                      <div className="border-t">
                        {post.media.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video controls className="w-full max-h-72 object-cover">
                            <source src={post.media} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img src={post.media} alt="media" className="w-full max-h-80 object-cover" />
                        )}
                      </div>
                    )}
                    <div className="p-4 flex items-center gap-5 text-sm">
                      <span>❤️ {post.likes?.length ?? 0}</span>
                      <span>💬 {post.comments?.length ?? 0}</span>
                      <span>🔄 {post.shares ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;









