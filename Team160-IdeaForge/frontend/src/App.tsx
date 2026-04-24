import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Polls from './pages/Polls';
import AdminDashboard from './pages/AdminDashboard';
import AdminItems from './pages/AdminItems';
import AdminOrders from './pages/AdminOrders';
import AdminPolls from './pages/AdminPolls';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <CartProvider>
              <Layout />
            </CartProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/menu" replace />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="polls" element={<Polls />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/items"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/orders"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/polls"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPolls />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
