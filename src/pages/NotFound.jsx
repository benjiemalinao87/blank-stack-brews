
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center space-y-6">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl text-gray-600">Oops! Page not found</p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
