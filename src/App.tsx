import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.js";
import ChatCommunity from "./pages/ChatCommunity.js";
import LandingPage from "./pages/LandingPage.js";
import Home from "./pages/Home.js";
import Profile from "./pages/Profile.js";
import LoginRegister from "./pages/LoginRegister.js";

import NotFound from "./pages/NotFount.js";
import { AuthProvider } from "./context/AuthContext.js";
import ProtectedRoute from "./protectedroute/ProtectedRoute.js";
import PaymentSuccess from "./components/PAYMENT/PaymentSuccess.js";
import PaymentCancelled from "./components/PAYMENT/PaymentCancelled.js";
import { LoadingProvider } from "./context/LoadingContext.js";


function App() {
  return (  
    <LoadingProvider>
      <AuthProvider>
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/chatcommunity" element={<ProtectedRoute><ChatCommunity /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/chat" element={<Navigate to="/chatcommunity" replace />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancelled" element={<PaymentCancelled />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;

