import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.tsx";

function LandingPage() {
  const { theme } = useContext(ThemeContext); 

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center text-center p-6 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <h1
        className={`text-4xl font-bold mb-4 ${
          theme === "dark" ? "text-yellow-400" : "text-blue-600"
        }`}
      >
        Welcome to Sangam
      </h1>
      <p
        className={`max-w-xl mb-6 ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Sangam is a new social media platform for India. Connect with people,
        share your ideas, and explore communities in multiple languages.
      </p>

      <div className="mt-12 grid md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div
          className={`p-4 rounded-lg shadow transition-colors ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-yellow-400" : "text-blue-600"
            }`}
          >
            🌐 Multilingual
          </h2>
          <p
            className={`mt-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Break language barriers with automatic translations.
          </p>
        </div>

        <div
          className={`p-4 rounded-lg shadow transition-colors ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-yellow-400" : "text-blue-600"
            }`}
          >
            🤝 Community
          </h2>
          <p
            className={`mt-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Join groups and connect with people who share your interests.
          </p>
        </div>

        <div
          className={`p-4 rounded-lg shadow transition-colors ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-yellow-400" : "text-blue-600"
            }`}
          >
            💰 Creator Economy
          </h2>
          <p
            className={`mt-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Support creators with UPI tips and digital goods.
          </p>
        </div>
      </div>

      <footer
        className={`mt-12 transition-colors ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        © {new Date().getFullYear()} Sangam. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
