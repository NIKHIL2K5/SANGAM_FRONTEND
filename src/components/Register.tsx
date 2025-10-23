import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.js";
import { ThemeContext } from "../context/ThemeContext.js";
import { API_BASE } from "../lib/api.js";
import { toast } from "react-hot-toast";
import { useLoading } from "../context/LoadingContext.js";

function Register() {
  const navigate = useNavigate()

  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [password, setNewPassword] = useState("")
  const [pending, setPending] = useState(false)

  const auth = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || "light";
  const login = auth?.login;
  const { show, hide } = useLoading();

  function changeUserName(event: React.ChangeEvent<HTMLInputElement>) {
    setUserName(event.target.value)
  }

  function setEmail(event: React.ChangeEvent<HTMLInputElement>) {
    setUserEmail(event.target.value)
  }

  function setPassword(event: React.ChangeEvent<HTMLInputElement>) {
    setNewPassword(event.target.value)
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (userName === "") return;
    if (userEmail === "") return;
    if (password === "") return;
    try {
      setPending(true)
      show("Creating your account...")
      const response = await fetch(`${API_BASE}/server/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send cookies
        body: JSON.stringify({ username: userName, email: userEmail, password }),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        toast.success("Registered successfully");
        if (login) login(data.user); // only user, no token
        navigate("/");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } finally {
      hide();
      setPending(false)
    }
  }
  return (
    <div
      className={` flex flex-col justify-center items-center transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
    >
      <h1
        className={`text-3xl font-bold mb-6 ${theme === "dark" ? "text-yellow-400" : "text-blue-600"
          }`}
      >
        SignUp
      </h1>
      <form
        onSubmit={handleRegister}
        className={`p-6 rounded-lg shadow-md w-80 transition-colors ${theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
      >
        <label htmlFor="username" className="block text-sm font-medium">
          UserName
        </label>
        <input
          id="username"
          className={`w-full border rounded-md p-2 mt-1 mb-4 transition-colors ${theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-gray-50 border-gray-300 text-black"
            }`}
          value={userName}
          onChange={changeUserName}
        />

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
          value={userEmail}
          onChange={setEmail}
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
          value={password}
          onChange={setPassword}
        />

        <button
          type="submit"
          disabled={pending}
          className={`w-full py-2 rounded-md font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${theme === "dark"
              ? "bg-yellow-500 hover:bg-yellow-400 text-black"
              : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
        >
          {pending ? "Creating..." : "SIGNUP"}
        </button>
      </form>
    </div>
  )
}

export default Register;
