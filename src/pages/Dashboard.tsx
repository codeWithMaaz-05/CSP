
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ParentDashboard from '@/components/ParentDashboard';
import DriverDashboard from '@/components/DriverDashboard';
import AdminDashboard from '@/components/AdminDashboard';

const Dashboard = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userProfile.role) {
      case 'parent':
        return <ParentDashboard />;
      case 'driver':
        return <DriverDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
