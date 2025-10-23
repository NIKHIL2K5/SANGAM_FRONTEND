import { useContext, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext.js"
import { useLoading } from "../context/LoadingContext.js"

interface ProtectedRouteProps {
    children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const auth = useContext(AuthContext);
    const { show, hide } = useLoading();

    useEffect(() => {
        if (auth?.loading) {
            show("Checking session...");
        } else {
            hide();
        }
    }, [auth?.loading, show, hide]);

    if (auth?.loading){
        return null;
    }

    if (!auth || !auth.user) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default ProtectedRoute;
