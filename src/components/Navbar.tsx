import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.js";
import { ThemeContext } from "../context/ThemeContext.js";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const logout = auth?.logout;
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || "light";
  const toggleTheme = themeContext?.toggleTheme;

  const handleLogout = () => {
    if (logout) logout();
  };

  return (
    <nav className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"} shadow-md sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link
          to="/"
          className={`text-2xl font-extrabold tracking-tight transition duration-300 ${theme === "dark" ? "text-yellow-400 hover:text-yellow-300" : "text-indigo-600 hover:text-indigo-800"
            }`}
        >
          Sangam
        </Link>

        <div className="hidden md:flex space-x-8 items-center">
          {user ? (
            <>
              <Link to="/home" className="hover:text-indigo-600 font-medium p-2">Home</Link>
              <Link to="/chatcommunity" className="hover:text-indigo-600 font-medium p-2">Chat</Link>
              <Link to="/profile" className="hover:text-indigo-600 font-medium p-2">Profile</Link>
              <div className="flex items-center space-x-3">
                <span className="font-medium">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300 font-medium"
                >
                  SignOut
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 font-medium"
            >
              SignIn / SignUp
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="ml-4 px-3 py-2 rounded-md border text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hover:text-indigo-600 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 5.25h16.5M3.75 12h16.5m-16.5 6.75h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"} md:hidden px-6 pb-4 space-y-3 shadow-md`}>
          {user ? (
            <>
              <Link to="/home" className="block hover:text-indigo-600 font-medium">Home</Link>
              <Link to="/chatcommunity" className="block hover:text-indigo-600 font-medium">Chat</Link>
              <Link to="/profile" className="block hover:text-indigo-600 font-medium">Profile</Link>
              <div className="space-y-2">
                <span className="block font-medium">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300 font-medium w-full"
                >
                  SignOut
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 font-medium block"
            >
              SignIn / SignUp
            </Link>
          )}

          <button
            onClick={toggleTheme}
            className="mt-2 w-full px-3 py-2 rounded-md border text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      )}
    </nav>
  );

}

export default Navbar
