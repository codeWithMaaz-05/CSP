
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Car, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChildDriverAssignment from './ChildDriverAssignment';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChildren: 0,
    totalRides: 0,
    activeDrivers: 0
  });
  const [users, setUsers] = useState([]);
  const [children, setChildren] = useState([]);
  const [rides, setRides] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchChildren();
    fetchRides();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersResult, childrenResult, ridesResult, driversResult] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('children').select('id'),
        supabase.from('rides').select('id'),
        supabase.from('profiles').select('id').eq('role', 'driver')
      ]);

      setStats({
        totalUsers: usersResult.data?.length || 0,
        totalChildren: childrenResult.data?.length || 0,
        totalRides: ridesResult.data?.length || 0,
        activeDrivers: driversResult.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select(`
          *,
          profiles:parent_id (full_name),
          driver:assigned_driver_id (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          children:child_id (name),
          profiles:driver_id (full_name)
        `)
        .order('ride_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDrivers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChildren}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRides}</div>
          </CardContent>
        </Card>
      </div>

      {/* Child-Driver Assignment Section */}
      <div className="mb-8">
        <ChildDriverAssignment />
      </div>

      {/* Users Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.slice(0, 10).map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{user.phone || 'N/A'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Children Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Children</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children.slice(0, 10).map((child: any) => (
                <TableRow key={child.id}>
                  <TableCell className="font-medium">{child.name}</TableCell>
                  <TableCell>{child.age}</TableCell>
                  <TableCell>{child.school_name}</TableCell>
                  <TableCell>{child.profiles?.full_name}</TableCell>
                  <TableCell>{child.driver?.full_name || 'Unassigned'}</TableCell>
                  <TableCell>{new Date(child.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Pickup Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.map((ride: any) => (
                <TableRow key={ride.id}>
                  <TableCell className="font-medium">{ride.children?.name}</TableCell>
                  <TableCell>{ride.profiles?.full_name}</TableCell>
                  <TableCell>{ride.ride_date}</TableCell>
                  <TableCell>{ride.pickup_time}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ride.status === 'dropped_off' ? 'bg-green-100 text-green-800' :
                      ride.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                      ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ride.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
