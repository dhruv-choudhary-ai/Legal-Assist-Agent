import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in on component mount and when route changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuthStatus();

    // Listen for storage changes (in case user logs in from another tab)
    window.addEventListener('storage', checkAuthStatus);

    return () => window.removeEventListener('storage', checkAuthStatus);
  }, [location]); // Re-check when route changes

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 960) setOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  function handleLogin() {
    navigate("/login");
  }

  async function handleLogout() {
    // Clear user data from localStorage FIRST
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);

    try {
      // Call logout API (but don't wait for it)
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Force full page reload to ensure clean state
    window.location.href = "/";
  }

  // Get initials from email for avatar
  function getInitials(email) {
    if (!email) return "U";
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-[#EDE9FE] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* ------------------ LOGO AREA ------------------ */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dyxnmjtrg/image/upload/v1695064580/copy-img_gd3jcp.png"
            alt="logo"
            className="w-32 sm:w-40 object-contain"
          />
        </Link>

        {/* ------------------ DESKTOP MENU ------------------ */}
        <div className="hidden md:flex items-center gap-8">

          <Link
            to="/about"
            className="text-gray-700 hover:text-black font-medium transition"
          >
            About
          </Link>

          <Link
            to="/service"
            className="text-gray-700 hover:text-black font-medium transition"
          >
            Services
          </Link>

          <Link
            to="/faq"
            className="text-gray-700 hover:text-black font-medium transition"
          >
            FAQs
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700 text-sm font-medium">Welcome</span>
              {user && (
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  title={user.email}
                >
                  {getInitials(user.email)}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 transition"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-[#1E2A5F] text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition"
            >
              LOGIN
            </button>
          )}
        </div>

        {/* ------------------ MOBILE MENU BUTTON ------------------ */}
        <button
          className="md:hidden text-gray-800"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ------------------ MOBILE MENU ------------------ */}
      {open && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">

          <Link
            to="/about"
            onClick={() => setOpen(false)}
            className="block text-gray-800 font-medium"
          >
            About
          </Link>

          <Link
            to="/service"
            onClick={() => setOpen(false)}
            className="block text-gray-800 font-medium"
          >
            Services
          </Link>

          <Link
            to="/faq"
            onClick={() => setOpen(false)}
            className="block text-gray-800 font-medium"
          >
            FAQs
          </Link>

          {isLoggedIn ? (
            <>
              {user && (
                <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                  <span className="text-gray-700 text-sm font-medium">Welcome</span>
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md"
                    title={user.email}
                  >
                    {getInitials(user.email)}
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                handleLogin();
              }}
              className="w-full bg-[#1E2A5F] text-white py-2 rounded-lg font-medium hover:opacity-90 transition"
            >
              LOGIN
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
