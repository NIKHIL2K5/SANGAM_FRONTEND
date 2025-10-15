import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
            <p className="text-lg text-gray-600 mb-6">Page Not Found</p>
            <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Go to Home</Link>
        </div>
    )
}
export default NotFound;