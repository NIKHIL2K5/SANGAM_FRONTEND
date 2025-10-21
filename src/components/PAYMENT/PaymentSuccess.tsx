import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { API_BASE } from "../../lib/api.js";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const to = searchParams.get("to");
  const [status, setStatus] = useState("Processing payment...");
  const [isSuccess, setIsSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const res = await fetch(`${API_BASE}/server/payment/confirm`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, to }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatus("Payment successful! Thank you for your support ❤️");
          setIsSuccess(true);
        } else {
          setStatus(data.message || "Payment confirmation failed.");
          setIsSuccess(false);
        }
      } catch (err) {
        setStatus("Something went wrong while confirming payment.");
        setIsSuccess(false);
      }
    };

    if (sessionId && to) confirmPayment();
  }, [sessionId, to]);

  // Redirect to profile after 5 seconds if success
  useEffect(() => {
    if (isSuccess === true) {
      const timer = setTimeout(() => {
        navigate("/profile");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <AnimatePresence mode="wait">
        {isSuccess === null ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"
            />
            <h1 className="text-2xl font-semibold text-green-700">
              {status}
            </h1>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 12,
            }}
            className="text-center"
          >
            <CheckCircle2 className="text-green-600 w-20 h-20 mx-auto mb-4" />
            <motion.h1
              className="text-3xl font-bold text-green-800 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Payment Successful!
            </motion.h1>
            <p className="text-green-700">{status}</p>
            <motion.p
              className="mt-4 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Redirecting to your profile in 5 seconds...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <XCircle className="text-red-500 w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-700 mb-2">
              Payment Failed
            </h1>
            <p className="text-red-600">{status}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PaymentSuccess;
