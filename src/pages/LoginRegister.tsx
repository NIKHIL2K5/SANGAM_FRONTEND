import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.js";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login.js";
import Register from "../components/Register.js";
import { ThemeContext } from "../context/ThemeContext.js";

function LoginRegister() {
  const [SignInOut, setSignInOut] = useState(false);
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || "light";
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth && auth.user && auth.token) {
      navigate("/home", { replace: true });
    }
  }, [auth?.user, auth?.token, navigate]);

  function changeLoginPage() {
    setSignInOut(!SignInOut);
  }

  return (
    <>
      <div
        className={`min-h-screen flex flex-col justify-center items-center transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
          }`}
      >
        {SignInOut ? (
          <div
            className={`p-6 rounded-lg shadow-md w-80 transition-colors ${theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
          >
            <Login />
            <button
              onClick={changeLoginPage}
              className={`mt-4 w-full py-2 rounded-md font-semibold transition-colors ${theme === "dark"
                ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
            >
              Not yet Signed In? Register
            </button>
          </div>
        ) : (
          <div
            className={`p-6 rounded-lg shadow-md w-80 transition-colors ${theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
          >
            <Register />
            <button
              onClick={changeLoginPage}
              className={`mt-4 w-full py-2 rounded-md font-semibold transition-colors ${theme === "dark"
                ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
            >
              Already Signed In? Login
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default LoginRegister;