import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../context/ThemeContext.js";

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
          fetch("http://localhost:3000/server/user/profile", { credentials: "include" }),
          fetch("http://localhost:3000/server/post", { credentials: "include" }),
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

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Hero / Cover */}
      <div
        className={`relative h-48 sm:h-56 md:h-64 ${
          theme === "dark"
            ? "bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-400"
            : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400"
        }`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_40%)]" />
      </div>

      {/* Card */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 sm:-mt-20 md:-mt-24">
        <div
          className={`rounded-2xl shadow-xl border ${
            theme === "dark" ? "bg-gray-900/80 border-gray-800" : "bg-white border-gray-200"
          } backdrop-blur supports-[backdrop-filter]:bg-opacity-80`}
        >
          {/* Header */}
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
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg">
              <div className={`rounded-xl px-4 py-3 sm:py-4 text-center border ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                <div className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Posts</div>
                <div className="text-xl sm:text-2xl font-bold">{myPosts.length}</div>
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











// import React, { useEffect, useState, useContext } from "react";
// import axios from "axios";
// import { AuthContext } from "../context/AuthContext.js";
// import { ThemeContext } from "../context/ThemeContext.js";

// type User = {
//     _id?: string;
//     username: string;
//     email: string;
//     avatar?: string;
//     followers?: string[];
//     following?: string[];
// };

// type Post = {
//     _id: string;
//     content: string;
//     media?: string[];
//     createdAt: string;
// };

// const Profile: React.FC = () => {
//     const auth = useContext(AuthContext);
//     const user = auth?.user;
//     const themeContext = useContext(ThemeContext);
//     const theme = themeContext && typeof themeContext === "object" && themeContext !== null && "theme" in themeContext
//         ? (themeContext as { theme: string }).theme
//         : "light";
//     const [profile, setProfile] = useState<User | null>(null);
//     const [posts, setPosts] = useState<Post[]>([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchProfile = async () => {
//             if (!user || !user.username) return;
//             try {
//                 const res = await axios.get(`/api/user/${user.username}`);
//                 setProfile(res.data);
//             } catch {
//                 setProfile(null);
//             }
//         };
//         const fetchPosts = async () => {
//             if (!user || !user.username) return;
//             try {
//                 const res = await axios.get(`/api/post/user/${user.username}`);
//                 setPosts(Array.isArray(res.data) ? res.data : []);
//             } catch {
//                 setPosts([]);
//             }
//         };
//         if (user?.username) {
//             setLoading(true);
//             Promise.all([fetchProfile(), fetchPosts()]).finally(() => setLoading(false));
//         }
//     }, [user]);

//     // Real-time followers/following fetch
//     const fetchFollowersFollowing = async () => {
//         if (!profile) return;
//         try {
//             const token = localStorage.getItem("token");
//             const headers: Record<string, string> = {};
//             if (token) headers["Authorization"] = `${token}`;
//             const res = await axios.get(`/api/user/${profile._id}`, { headers });
//             setProfile(res.data);
//         } catch {
//             // Optionally handle error
//         }
//     };

//     // Follow/unfollow button handler
//     const handleFollowToggle = async () => {
//         if (!profile) return;
//         try {
//             const token = localStorage.getItem("token");
//             const headers: Record<string, string> = {};
//             if (token) headers["Authorization"] = `${token}`;
//             await axios.put(`/api/user/${profile._id}/follow`, {}, { headers });
//             await fetchFollowersFollowing();
//         } catch {
//             alert("Failed to follow/unfollow user");
//         }
//     };

//     if (loading) {
//         return <div className={`max-w-2xl mx-auto p-4 min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>Loading...</div>;
//     }

//     if (!profile) {
//         return <div className={`max-w-2xl mx-auto p-4 min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>User not found.</div>;
//     }

//     return (
//         <div className={` mx-auto p-4 min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
//             <div className="flex items-center mb-6">
//                 {profile.avatar ? (
//                     <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded-full mr-4 border-2 border-blue-400" />
//                 ) : (
//                     <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 text-2xl font-bold border-2 ${theme === "dark" ? "bg-gray-700 border-yellow-400 text-yellow-400" : "bg-gray-300 border-blue-400 text-blue-600"}`}>
//                         {profile.username ? profile.username.charAt(0).toUpperCase() : "U"}
//                     </div>
//                 )}
//                 <div>
//                     <div className={`text-2xl font-bold ${theme === "dark" ? "text-yellow-400" : "text-blue-700"}`}>{profile.username}</div>
//                     <div className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{profile.email}</div>
//                     {/* Avatar upload form */}
//                     <form
//                         className="mt-2"
//                         onSubmit={async (e) => {
//                             e.preventDefault();
//                             const fileInput = (e.target as HTMLFormElement).avatar as HTMLInputElement;
//                             if (!fileInput.files || fileInput.files.length === 0) return;
//                             const formData = new FormData();
//                             if (fileInput.files[0]) {
//                                 formData.append("avatar", fileInput.files[0]);
//                             }
//                             try {
//                                 const token = localStorage.getItem("token");
//                                 const headers: Record<string, string> = {};
//                                 if (token) headers["Authorization"] = `${token}`;
//                                 await axios.put(`/api/user/${profile._id}/avatar`, formData, { headers });
//                                 // Refetch profile after upload
//                                 const res = await axios.get(`/api/user/${profile.username}`);
//                                 setProfile(res.data);
//                                 alert("Avatar updated!");
//                             } catch (err) {
//                                 alert("Failed to update avatar");
//                             }
//                         }}
//                     >
//                         <input
//                             type="file"
//                             name="avatar"
//                             accept="image/*"
//                             className="block mt-2 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold transition-colors file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
//                         />
//                         <button
//                             type="submit"
//                             className={`mt-2 px-3 py-1 rounded font-semibold transition-colors ${theme === "dark" ? "bg-yellow-500 text-black hover:bg-yellow-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
//                         >
//                             Update Avatar
//                         </button>
//                     </form>
//                 </div>
//             </div>
//             <div className="flex gap-8 mb-6 items-center">
//                 <div>
//                     <span className={`font-semibold ${theme === "dark" ? "text-yellow-400" : "text-blue-700"}`}>Followers:</span> {profile.followers?.length || 0}
//                 </div>
//                 <div>
//                     <span className={`font-semibold ${theme === "dark" ? "text-yellow-400" : "text-blue-700"}`}>Following:</span> {profile.following?.length || 0}
//                 </div>
//                 {/* Follow/Unfollow button */}
//                 {user && user._id && profile && profile._id && user._id !== profile._id && (
//                     <button
//                         onClick={handleFollowToggle}
//                         className={`ml-4 px-3 py-1 rounded font-semibold transition-colors ${theme === "dark" ? "bg-yellow-500 text-black hover:bg-yellow-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
//                     >
//                         {profile.followers?.includes(user._id ?? "") ? "Unfollow" : "Follow"}
//                     </button>
//                 )}
//             </div>
//             <h2 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-yellow-400" : "text-blue-700"}`}>Your Posts</h2>
//             <div className="space-y-4">
//                 {posts.length === 0 && <div className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>No posts yet.</div>}
//                 {posts.map(post => (
//                     <div key={post._id} className={`shadow rounded-lg p-4 border transition-colors ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
//                         <div className={`text-xs mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{new Date(post.createdAt).toLocaleString()}</div>
//                         {post.content && <div className={`mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{post.content}</div>}
//                         {post.media && post.media.length > 0 && (
//                             <div className="flex flex-wrap gap-2">
//                                 {post.media.map((url, idx) =>
//                                     url.match(/\.(mp4|mov|avi)$/i) ? (
//                                         <video key={idx} src={`http://localhost:3000${url}`} controls className={`rounded max-h-40 border w-full sm:w-1/2 object-contain ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`} />
//                                     ) : (
//                                         <img key={idx} src={`http://localhost:3000${url}`} alt="media" className={`rounded max-h-40 border w-full sm:w-1/2 object-contain ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`} />
//                                     )
//                                 )}
//                             </div>
//                         )}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default Profile;