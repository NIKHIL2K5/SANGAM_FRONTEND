import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ThemeContext } from "../context/ThemeContext.js";
import { io, Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";

interface UserLite { _id: string; username: string; profilepic?: string }
interface CommunityLite { _id: string; name: string; avatar?: string }
interface Msg { _id: string; roomId: string; body: string; from: string; createdAt: string; optimistic?: boolean; clientId?: string }

const API_BASE = "https://sangam-backend-b7pm.onrender.com";

function ChatCommunity() {
    const [activeTab, setActiveTab] = useState<"chat" | "community">("chat");
    const [currentUser, setCurrentUser] = useState<UserLite | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserLite | null>(null);
    const [selectedCommunity, setSelectedCommunity] = useState<CommunityLite | null>(null);
    const [people, setPeople] = useState<UserLite[]>([]);
    const [communities, setCommunities] = useState<CommunityLite[]>([]);
    const [roomMessages, setRoomMessages] = useState<Record<string, Msg[]>>({});
    const [input, setInput] = useState("");
    const [isPeerTyping, setIsPeerTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchUser, setSearchUser] = useState("");
    const [searchCommunity, setSearchCommunity] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    // Community create with search
    const [newCommunityName, setNewCommunityName] = useState("");
    const [newCommunityDesc, setNewCommunityDesc] = useState("");
    const [newCommunityLang, setNewCommunityLang] = useState("en");
    const [newCommunityRegion, setNewCommunityRegion] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [memberResults, setMemberResults] = useState<UserLite[]>([]);
    const [pendingMembers, setPendingMembers] = useState<UserLite[]>([]);
    // Manage members via search
    const [manageSearch, setManageSearch] = useState("");
    const [manageResults, setManageResults] = useState<UserLite[]>([]);
    const [membersToAdd, setMembersToAdd] = useState<UserLite[]>([]);

    const themeContext = useContext(ThemeContext);
    const theme = themeContext && typeof themeContext === "object" && themeContext !== null && "theme" in themeContext ? (themeContext as { theme: string }).theme : "light";

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/server/user/profile`, { credentials: "include" });
                if (res.ok) {
                    const u = await res.json();
                    setCurrentUser({ _id: u._id, username: u.username, profilepic: u.profilepic });
                }
            } catch { }
        })();
    }, []);

    // Load recent DM conversations for sidebar when user is known
    useEffect(() => {
        (async () => {
            try {
                if (!currentUser) return;
                const res = await fetch(`${API_BASE}/server/chat/conversations/list`, { credentials: "include" });
                if (res.ok) {
                    const list = await res.json();
                    const unique: Record<string, UserLite> = {};
                    for (const item of list) {
                        const o = item.other;
                        if (o && o._id && !unique[o._id]) {
                            unique[o._id] = { _id: String(o._id), username: o.username || "User", profilepic: o.profilepic };
                        }
                    }
                    setPeople(Object.values(unique));
                }
            } catch (e) {
                console.error("Failed to load conversations:", (e as any)?.message || e);
            }
        })();
    }, [currentUser]);

    // Load communities current user belongs to
    useEffect(() => {
        (async () => {
            try {
                if (!currentUser) return;
                const res = await fetch(`${API_BASE}/server/community/my`, { credentials: "include" });
                if (res.ok) {
                    const arr = await res.json();
                    const mapped: CommunityLite[] = (arr || []).map((c: any) => ({ _id: String(c._id), name: c.name, avatar: c.avatar }));
                    setCommunities(mapped);
                }
            } catch (e) {
                console.error("Failed to load communities:", (e as any)?.message || e);
            }
        })();
    }, [currentUser]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const userId = params.get("user");
        const username = params.get("username") || "";
        if (userId) {
            setActiveTab("chat");
            setSelectedUser({ _id: userId, username });
        }
    }, [location.search]);

    const socket: Socket | null = useMemo(() => {
        const s = io(API_BASE, { withCredentials: true, autoConnect: true });
        return s;
    }, []);

    useEffect(() => {
        if (!socket) return;
        const onError = (err: any) => console.error("socket connect_error", err?.message || err);
        const onDisconnect = (reason: string) => { console.warn("socket disconnected", reason); setIsConnected(false); };
        const onConnect = () => { setIsConnected(true); };
        socket.on("connect_error", onError);
        socket.on("disconnect", onDisconnect);
        socket.on("connect", onConnect);
        return () => {
            socket.off("connect_error", onError);
            socket.off("disconnect", onDisconnect);
            socket.off("connect", onConnect);
            socket.close();
        };
    }, [socket]);

    const currentRoomId = useMemo(() => {
        if (activeTab === "chat" && currentUser && selectedUser) {
            return `dm:${[currentUser._id, selectedUser._id].sort().join("_")}`;
        }
        if (activeTab === "community" && selectedCommunity) {
            return `community:${selectedCommunity._id}`;
        }
        return "";
    }, [activeTab, currentUser, selectedUser, selectedCommunity]);

    useEffect(() => {
        if (!socket) return;
        const onNew = (m: Msg) => {
            setRoomMessages((prev) => ({ ...prev, [m.roomId]: [...(prev[m.roomId] || []), m] }));
        };
        const onAck = ({ clientId, messageId }: { clientId: string; messageId: string }) => {
            const rid = currentRoomId;
            if (!rid) return;
            setRoomMessages((prev) => ({
                ...prev,
                [rid]: (prev[rid] || []).map(m => m.clientId === clientId ? { ...m, _id: messageId, optimistic: false } : m)
            }));
        };
        const onHistory = ({ roomId, messages }: { roomId: string; messages: Msg[] }) => {
            setRoomMessages((prev) => ({ ...prev, [roomId]: messages }));
        };
        const onConnect = () => {
            const rid = prevRoomRef.current || currentRoomId;
            if (rid) socket.emit("join", { roomId: rid });
            setIsConnected(true);
        };
        const onTyping = ({ userId, isTyping, roomId }: { userId: string; isTyping: boolean; roomId: string }) => {
            if (roomId !== currentRoomId) return;
            // Ignore own typing notifications
            if (currentUser && userId === currentUser._id) return;
            setIsPeerTyping(isTyping);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (isTyping) {
                typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 3000);
            }
        };
        socket.on("message:new", onNew);
        socket.on("message:ack", onAck);
        socket.on("history", onHistory);
        socket.on("connect", onConnect);
        socket.on("typing", onTyping);
        return () => {
            socket.off("message:new", onNew);
            socket.off("message:ack", onAck);
            socket.off("history", onHistory);
            socket.off("connect", onConnect);
            socket.off("typing", onTyping);
        };
    }, [socket, currentRoomId, currentUser]);

    const prevRoomRef = useRef<string>("");
    useEffect(() => {
        if (!socket) return;
        const prev = prevRoomRef.current;
        if (prev) socket.emit("leave", { roomId: prev });
        if (currentRoomId) socket.emit("join", { roomId: currentRoomId });
        prevRoomRef.current = currentRoomId;
    }, [socket, currentRoomId]);

    // Preload room history on room change if not already loaded (works connected or disconnected)
    useEffect(() => {
        (async () => {
            if (!currentRoomId) return;
            const existing = roomMessages[currentRoomId];
            if (existing && existing.length > 0) return;
            try {
                if (currentRoomId.startsWith("dm:") && currentUser && selectedUser) {
                    const res = await fetch(`${API_BASE}/server/chat/dm/${encodeURIComponent(selectedUser._id)}/history`, { credentials: "include" });
                    if (res.ok) {
                        const data = await res.json();
                        const mapped: Msg[] = (data.messages || []).map((m: any) => ({
                            _id: String(m._id || `${m.sender}-${m.createdAt}`),
                            roomId: currentRoomId,
                            body: m.content,
                            from: String(m.sender || ""),
                            createdAt: new Date(m.createdAt).toISOString(),
                        }));
                        setRoomMessages(prev => ({ ...prev, [currentRoomId]: mapped }));
                    }
                } else if (currentRoomId.startsWith("community:") && selectedCommunity) {
                    const communityId = selectedCommunity._id;
                    const res = await fetch(`${API_BASE}/server/community/${encodeURIComponent(communityId)}/messages`, { credentials: "include" });
                    if (res.ok) {
                        const data = await res.json();
                        const mapped: Msg[] = (data || []).map((m: any) => ({
                            _id: String(m._id),
                            roomId: currentRoomId,
                            body: m.content,
                            from: m.sender ? String(m.sender) : "",
                            createdAt: new Date(m.createdAt).toISOString(),
                        }));
                        setRoomMessages(prev => ({ ...prev, [currentRoomId]: mapped }));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch history via REST:", (e as any)?.message || e);
            }
        })();
    }, [currentRoomId, currentUser, selectedUser, selectedCommunity, roomMessages]);

    const sendMessage = async () => {
        if (!currentRoomId || !input.trim() || !currentUser) return;
        const body = input.trim();
        const clientId = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
            ? (crypto as any).randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        const optimistic: Msg = { _id: clientId, clientId, roomId: currentRoomId, body, from: currentUser._id, createdAt: new Date().toISOString(), optimistic: true };
        setRoomMessages((prev) => ({ ...prev, [currentRoomId]: [...(prev[currentRoomId] || []), optimistic] }));

        setInput("");

        if (socket && isConnected) {
            socket.emit("message:send", { roomId: currentRoomId, body, clientId });
            // Stop typing when message is sent
            socket.emit("typing", { roomId: currentRoomId, isTyping: false });
            return;
        }

        // REST fallback when socket disconnected
        try {
            if (currentRoomId.startsWith("dm:") && selectedUser) {
                const res = await fetch(`${API_BASE}/server/chat/dm/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ toUserId: selectedUser._id, content: body })
                });
                if (res.ok) {
                    const saved = await res.json();
                    setRoomMessages(prev => ({
                        ...prev,
                        [currentRoomId]: (prev[currentRoomId] || []).map(m => m.clientId === clientId ? { ...m, _id: String(saved._id), optimistic: false } : m)
                    }));
                }
            } else if (currentRoomId.startsWith("community:") && selectedCommunity) {
                const res = await fetch(`${API_BASE}/server/community/${encodeURIComponent(selectedCommunity._id)}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ content: body })
                });
                if (res.ok) {
                    const saved = await res.json();
                    setRoomMessages(prev => ({
                        ...prev,
                        [currentRoomId]: (prev[currentRoomId] || []).map(m => m.clientId === clientId ? { ...m, _id: String(saved._id), optimistic: false } : m)
                    }));
                }
            }
        } catch (e) {
            console.error("Failed to send message via REST:", (e as any)?.message || e);
        }
    };

    const openDM = (u: UserLite) => {
        setSelectedUser(u);
        setActiveTab("chat");
        const params = new URLSearchParams();
        params.set("user", u._id);
        params.set("username", u.username);
        navigate({ pathname: "/chatcommunity", search: params.toString() });
    };

    // Debounced user search for community creation
    useEffect(() => {
        const h = setTimeout(async () => {
            try {
                const q = memberSearch.trim();
                if (!q) { setMemberResults([]); return; }
                const res = await fetch(`${API_BASE}/server/user/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
                if (res.ok) {
                    const arr = await res.json();
                    setMemberResults(arr as UserLite[]);
                }
            } catch {}
        }, 300);
        return () => clearTimeout(h);
    }, [memberSearch]);

    // Debounced user search for managing members
    useEffect(() => {
        const h = setTimeout(async () => {
            try {
                const q = manageSearch.trim();
                if (!q) { setManageResults([]); return; }
                const res = await fetch(`${API_BASE}/server/user/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
                if (res.ok) {
                    const arr = await res.json();
                    setManageResults(arr as UserLite[]);
                }
            } catch {}
        }, 300);
        return () => clearTimeout(h);
    }, [manageSearch]);

    const addPendingMember = (u: UserLite) => {
        setPendingMembers(prev => prev.some(x => x._id === u._id) ? prev : [...prev, u]);
    };
    const removePendingMember = (id: string) => {
        setPendingMembers(prev => prev.filter(x => x._id !== id));
    };
    const pickMemberToAdd = (u: UserLite) => {
        setMembersToAdd(prev => prev.some(x => x._id === u._id) ? prev : [...prev, u]);
    };
    const removePickedMember = (id: string) => {
        setMembersToAdd(prev => prev.filter(x => x._id !== id));
    };

    const createCommunity = async () => {
        if (!newCommunityName.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/server/community`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: newCommunityName.trim(),
                    description: newCommunityDesc || undefined,
                    language: newCommunityLang || undefined,
                    region: newCommunityRegion || undefined,
                    members: pendingMembers.map(m => m._id)
                })
            });
            if (res.ok) {
                const c = await res.json();
                const lite: CommunityLite = { _id: c._id, name: c.name, avatar: c.avatar };
                setCommunities(prev => prev.find(x => x._id === lite._id) ? prev : [lite, ...prev]);
                setSelectedCommunity(lite);
                setActiveTab("community");
                setNewCommunityName(""); setNewCommunityDesc(""); setNewCommunityLang("en"); setNewCommunityRegion("");
                setMemberSearch(""); setMemberResults([]); setPendingMembers([]);
            }
        } catch {}
    };

    const addMembersViaSearch = async () => {
        if (!selectedCommunity || membersToAdd.length === 0) return;
        try {
            const res = await fetch(`${API_BASE}/server/community/${encodeURIComponent(selectedCommunity._id)}/members/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ members: membersToAdd.map(u => u._id) })
            });
            if (res.ok) {
                setMembersToAdd([]);
                setManageSearch(""); setManageResults([]);
            }
        } catch {}
    };

    const activeMessages = currentRoomId ? (roomMessages[currentRoomId] || []) : [];

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="mb-4 flex">
                    <button
                        className={`flex-1 rounded-t border-b-2 py-2 text-sm font-semibold ${activeTab === "chat" ? (theme === "dark" ? "bg-white text-black border-white" : "bg-black text-white border-black") : (theme === "dark" ? "bg-gray-900 text-gray-300 border-gray-800" : "bg-white text-gray-700 border-gray-200")}`}
                        onClick={() => setActiveTab("chat")}
                    >
                        Chat
                    </button>
                    <button
                        className={`flex-1 rounded-t border-b-2 py-2 text-sm font-semibold ${activeTab === "community" ? (theme === "dark" ? "bg-white text-black border-white" : "bg-black text-white border-black") : (theme === "dark" ? "bg-gray-900 text-gray-300 border-gray-800" : "bg-white text-gray-700 border-gray-200")}`}
                        onClick={() => setActiveTab("community")}
                    >
                        Community
                    </button>
                </div>

                {activeTab === "chat" && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <aside className="lg:col-span-4">
                            <div className={`rounded-2xl border p-4 ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}>
                                <div className="mb-3 flex gap-2">
                                    <input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Search user id or username" className={`flex-1 rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    <button onClick={() => searchUser && openDM({ _id: searchUser, username: searchUser })} className={`${theme === "dark" ? "bg-white text-black" : "bg-black text-white"} rounded-lg px-3 text-sm font-semibold`}>
                                        Start
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {people.length === 0 && (
                                        <div className="text-sm opacity-60">No recent conversations</div>
                                    )}
                                    {people.map((p) => (
                                        <button key={p._id} onClick={() => openDM(p)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${selectedUser?._id === p._id ? (theme === "dark" ? "bg-gray-900" : "bg-gray-100") : ""}`}>
                                            <img src={p.profilepic || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"} className="h-9 w-9 rounded-full object-cover" />
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{p.username}</div>
                                                <div className="text-xs opacity-60">Tap to chat</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <section className="lg:col-span-8">
                            <div className={`flex h-[70vh] flex-col overflow-hidden rounded-2xl border ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}>
                                <div className={`flex items-center gap-3 border-b px-4 py-3 text-sm font-semibold ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
                                    {selectedUser ? (
                                        <div className="flex items-center gap-3">
                                            <img src={selectedUser.profilepic || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"} className="h-8 w-8 rounded-full object-cover" />
                                            <div className="flex flex-col">
                                                <span className="truncate">{selectedUser.username}</span>
                                                {isPeerTyping && <span className="text-xs opacity-70">typing…</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="opacity-60">Select a user to start chatting</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                                    {activeMessages.length === 0 && (
                                        <div className="text-center text-sm opacity-60">No messages yet</div>
                                    )}
                                    {activeMessages.map((m) => {
                                        const mine = currentUser && m.from === currentUser._id;
                                        return (
                                            <div key={m._id} className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? (theme === "dark" ? "ml-auto bg-white text-black" : "ml-auto bg-black text-white") : (theme === "dark" ? "bg-gray-900" : "bg-gray-100")}`}>
                                                <div>{m.body}</div>
                                                <div className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleTimeString()}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className={`flex items-center gap-2 border-t p-3 ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
                                    <input value={input} onChange={(e) => {
                                        const v = e.target.value;
                                        setInput(v);
                                        if (socket && currentRoomId) {
                                            socket.emit("typing", { roomId: currentRoomId, isTyping: !!v });
                                        }
                                    }} disabled={!selectedUser} placeholder={selectedUser ? "Type a message" : "Select a user"} className={`flex-1 rounded-full border px-4 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    <button onClick={sendMessage} disabled={!selectedUser || !input.trim()} className={`rounded-full px-4 py-2 text-sm font-semibold ${theme === "dark" ? "bg-white text-black disabled:opacity-50" : "bg-black text-white disabled:opacity-50"}`}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "community" && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <aside className="lg:col-span-4">
                            <div className={`rounded-2xl border p-4 ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}>
                                <div className="mb-3 flex gap-2">
                                    <input value={searchCommunity} onChange={(e) => setSearchCommunity(e.target.value)} placeholder="Search or enter community id" className={`flex-1 rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    <button onClick={() => setSelectedCommunity(searchCommunity ? { _id: searchCommunity, name: searchCommunity } as CommunityLite : null)} className={`${theme === "dark" ? "bg-white text-black" : "bg-black text-white"} rounded-lg px-3 text-sm font-semibold`}>
                                        Open
                                    </button>
                                </div>
                                <div className="mb-4 border-t pt-4">
                                    <div className="mb-2 text-xs opacity-70">Create community</div>
                                    <input value={newCommunityName} onChange={(e)=>setNewCommunityName(e.target.value)} placeholder="Name" className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    <input value={newCommunityDesc} onChange={(e)=>setNewCommunityDesc(e.target.value)} placeholder="Description (optional)" className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    <div className="mb-2 flex gap-2">
                                        <input value={newCommunityLang} onChange={(e)=>setNewCommunityLang(e.target.value)} placeholder="Lang (en)" className={`flex-1 rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                        <input value={newCommunityRegion} onChange={(e)=>setNewCommunityRegion(e.target.value)} placeholder="Region" className={`w-[130px] rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    </div>
                                    <input value={memberSearch} onChange={(e)=>setMemberSearch(e.target.value)} placeholder="Search users to add" className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    {memberResults.length>0 && (
                                        <div className={`mb-2 max-h-40 overflow-auto rounded-lg border ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
                                            {memberResults.map(u => (
                                                <button key={u._id} onClick={()=>addPendingMember(u)} className={`flex w-full items-center gap-2 px-2 py-2 text-left text-sm ${theme === "dark" ? "hover:bg-gray-900" : "hover:bg-gray-100"}`}>
                                                    <img src={u.profilepic || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"} className="h-6 w-6 rounded-full object-cover" />
                                                    <span className="truncate">{u.username}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {pendingMembers.length>0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {pendingMembers.map(u => (
                                                <span key={u._id} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
                                                    {u.username}
                                                    <button onClick={()=>removePendingMember(u._id)} className="opacity-70">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={createCommunity} disabled={!newCommunityName.trim()} className={`${theme === "dark" ? "bg-white text-black disabled:opacity-50" : "bg-black text-white disabled:opacity-50"} rounded-lg px-3 py-2 text-sm font-semibold`}>
                                        Create
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {communities.length === 0 && (
                                        <div className="text-sm opacity-60">No communities</div>
                                    )}
                                    {communities.map((c) => (
                                        <button key={c._id} onClick={() => setSelectedCommunity(c)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${selectedCommunity?._id === c._id ? (theme === "dark" ? "bg-gray-900" : "bg-gray-100") : ""}`}>
                                            <img src={c.avatar || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"} className="h-9 w-9 rounded-full object-cover" />
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{c.name}</div>
                                                <div className="text-xs opacity-60">Tap to open</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <section className="lg:col-span-8">
                            <div className={`flex h-[70vh] flex-col overflow-hidden rounded-2xl border ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}>
                                <div className={`flex items-center gap-3 border-b px-4 py-3 text-sm font-semibold ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
                                    {selectedCommunity ? (
                                        <div className="flex items-center gap-3">
                                            <img src={selectedCommunity.avatar || "https://res.cloudinary.com/ddajnqkjo/image/upload/v1760416394/296fe121-5dfa-43f4-98b5-db50019738a7_gsc8u9.jpg"} className="h-8 w-8 rounded-full object-cover" />
                                            <span className="truncate">{selectedCommunity.name}</span>
                                        </div>
                                    ) : (
                                        <span className="opacity-60">Select a community to start</span>
                                    )}
                                </div>
                                
                                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                                    {activeMessages.length === 0 && (
                                        <div className="text-center text-sm opacity-60">No messages yet</div>
                                    )}
                                    {activeMessages.map((m) => {
                                        const mine = currentUser && m.from === currentUser._id;
                                        return (
                                            <div key={m._id} className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? (theme === "dark" ? "ml-auto bg-white text-black" : "ml-auto bg-black text-white") : (theme === "dark" ? "bg-gray-900" : "bg-gray-100")}`}>
                                                <div>{m.body}</div>
                                                <div className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleTimeString()}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className={`flex items-center gap-2 border-t p-3 ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
                                    <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!selectedCommunity} placeholder={selectedCommunity ? "Type a message" : "Select a community"} className={`flex-1 rounded-full border px-4 py-2 text-sm ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                                    <button onClick={sendMessage} disabled={!selectedCommunity || !input.trim()} className={`rounded-full px-4 py-2 text-sm font-semibold ${theme === "dark" ? "bg-white text-black disabled:opacity-50" : "bg-black text-white disabled:opacity-50"}`}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatCommunity;


































