import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import client from '../api/client';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session from localStorage on page load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ============================================
  // LOGIN
  // ============================================
  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Save session
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    // Route to role-specific dashboard
    const dashboardMap = {
      farmer: '/farmer/dashboard',
      staff: '/staff/dashboard',
      admin: '/admin/dashboard',
      ceo: '/ceo/dashboard',
    };
    const route = dashboardMap[data.user.role] || '/';
    navigate(route);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data.user;
  };

  // ============================================
  // REGISTER
  // ============================================
  const register = async (userData) => {
    try {
      const { data } = await client.post('/auth/register', userData);

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(message);
    }
  };

  // ============================================
  // REFRESH USER — fetch fresh data from backend
  // ============================================
  const refreshUser = async () => {
    try {
      const { data } = await client.get('/auth/me');
      const updatedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        profile: data.profile,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Refresh user error:', err);
      throw err;
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
    toast.info('You have been logged out.');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!token,
    isFarmer: user?.role === 'farmer',
    isStaff: user?.role === 'staff',
    isAdmin: user?.role === 'admin',
    isCeo: user?.role === 'ceo',
    hasFarmerProfile: !!user?.profile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};