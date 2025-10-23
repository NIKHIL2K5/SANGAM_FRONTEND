import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.js";
import { ThemeContext } from "../context/ThemeContext.js";
import { API_BASE } from "../lib/api.js";
import { toast } from "react-hot-toast";
import { useLoading } from "../context/LoadingContext.js";
function Login() {
  const [useremail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [pending, setPending] = useState(false)

  const navigate = useNavigate()
  const themeContext = useContext(ThemeContext)
  const theme = (themeContext as any)?.theme ?? "light"

  const auth = useContext(AuthContext)
  const login = (auth as any)?.login
  const { show, hide } = useLoading()


  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (useremail === "") return;
    if (userPassword === "") return;
    try {
      setPending(true)
      show("Signing in...")
      const response = await fetch(`${API_BASE}/server/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send cookies
        body: JSON.stringify({ email: useremail, password: userPassword }),
      });
  
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        login(data.user); // only user, no token
        toast.success("Logged in successfully");
        navigate("/");
      } else {
        toast.error(data.message || "Login failed");
      }
    } finally {
      hide();
      setPending(false)
    }
  }

  function setEmail(event: React.ChangeEvent<HTMLInputElement>) {
    setUserEmail(event.target.value)
  }

  function setPassword(event: React.ChangeEvent<HTMLInputElement>) {
    setUserPassword(event.target.value)
  }



  return (
    <div
      className={`flex flex-col justify-center items-center transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
    >
      <h1
        className={`text-3xl font-bold mb-6 ${theme === "dark" ? "text-yellow-400" : "text-blue-600"
          }`}
      >
        SignIn
      </h1>
      <form
        onSubmit={handleLogin}
        className={`p-6 rounded-lg shadow-md w-80 transition-colors ${theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
      >
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          className={`w-full border rounded-md p-2 mt-1 mb-4 transition-colors ${theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-gray-50 border-gray-300 text-black"
            }`}
          onChange={setEmail}
          value={useremail}
        />

        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          id="password"
          className={`w-full border rounded-md p-2 mt-1 mb-4 transition-colors ${theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-gray-50 border-gray-300 text-black"
            }`}
          onChange={setPassword}
          value={userPassword}
        />

        <button
          type="submit"
          disabled={pending}
          className={`w-full py-2 rounded-md font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${theme === "dark"
              ? "bg-yellow-500 hover:bg-yellow-400 text-black"
              : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
        >
          {pending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  )
}

export default Login;
