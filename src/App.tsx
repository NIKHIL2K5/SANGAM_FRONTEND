import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import ChatCommunity from "./pages/ChatCommunity.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import Home from "./pages/Home.tsx";
import Profile from "./pages/Profile.tsx"
import LoginRegister from "./pages/LoginRegister.tsx";

import NotFound from "./pages/NotFount.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import ProtectedRoute from "./protectedroute/ProtectedRoute.tsx";
import PaymentSuccess from "./components/PAYMENT/PaymentSuccess.tsx";
import PaymentCancelled from "./components/PAYMENT/PaymentCancelled.tsx";


function App() {
  return (  
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
  );
}

export default App;
