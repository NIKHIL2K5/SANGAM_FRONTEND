import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext.js"

interface ProtectedRouteProps {
    children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const auth = useContext(AuthContext);
    if (auth?.loading){
        return <div>Loading...</div>
    }

    if (!auth || !auth.user) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default ProtectedRoute;
