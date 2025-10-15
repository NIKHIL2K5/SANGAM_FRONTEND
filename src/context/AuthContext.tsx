import React, { createContext, useState, useEffect, type ReactNode } from "react";
import { API_BASE } from "../lib/api.js";

interface User {
    _id?: string;
    username: string;
    email: string;
    avatar?: string;
    followers?: string[];
    following?: string[];
}

export interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading,setLoading]=useState<boolean>(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_BASE}/server/user/profile`, {
                    credentials: "include"
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            }finally{
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const login = (user: User) => {
        setUser(user);
    };
    const logout = () => {
        setUser(null);
        
    };

    const value = React.useMemo(() => ({ user, login, logout, loading }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}