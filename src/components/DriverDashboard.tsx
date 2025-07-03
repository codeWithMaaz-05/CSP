import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Calendar, Users, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DriverDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [assignedChildren, setAssignedChildren] = useState([]);
  const [rides, setRides] = useState([]);
  const [todayRides, setTodayRides] = useState([]);

  useEffect(() => {
    fetchAssignedChildren();
    fetchRides();
    fetchTodayRides();
  }, []);

  const fetchAssignedChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*, profiles:parent_id (full_name, phone)')
        .eq('assigned_driver_id', userProfile.id);
      
      if (error) throw error;
      setAssignedChildren(data || []);
    } catch (error) {
      console.error('Error fetching assigned children:', error);
    }
  };

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          children:child_id (name, school_name, pickup_address, drop_address),
          profiles:child_id (parent_id)
        `)
        .eq('driver_id', userProfile.id)
        .order('ride_date', { ascending: false });
      
      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  };

  const fetchTodayRides = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          children:child_id (name, school_name, pickup_address, drop_address)
        `)
        .eq('driver_id', userProfile.id)
        .eq('ride_date', today)
        .order('pickup_time', { ascending: true });
      
      if (error) throw error;
      setTodayRides(data || []);
    } catch (error) {
      console.error('Error fetching today rides:', error);
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          status,
          drop_time: status === 'dropped_off' ? new Date().toTimeString().split(' ')[0] : null
        })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ride status updated to ${status.replace('_', ' ')}`
      });

      fetchRides();
      fetchTodayRides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {userProfile.full_name}
        </h1>
        <p className="text-gray-600">Your driver dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedChildren.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rides.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRides.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Rides */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today's Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {todayRides.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No rides scheduled for today.
            </p>
          ) : (
            <div className="space-y-4">
              {todayRides.map((ride: any) => (
                <div key={ride.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{ride.children?.name}</h4>
                      <p className="text-gray-600">{ride.children?.school_name}</p>
                      <p className="text-sm text-gray-500">Pickup: {ride.pickup_time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      ride.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                      ride.status === 'dropped_off' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ride.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>Pickup: {ride.pickup_address}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>Drop: {ride.drop_address}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {ride.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateRideStatus(ride.id, 'picked_up')}
                      >
                        Mark as Picked Up
                      </Button>
                    )}
                    {ride.status === 'picked_up' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateRideStatus(ride.id, 'dropped_off')}
                      >
                        Mark as Dropped Off
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Children */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Assigned Children</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedChildren.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No children assigned yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {assignedChildren.map((child: any) => (
                <Card key={child.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg">{child.name}</h3>
                    <p className="text-gray-600">Age: {child.age}</p>
                    <p className="text-gray-600">School: {child.school_name}</p>
                    <p className="text-gray-600 text-sm mt-2">
                      Parent: {child.profiles?.full_name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Phone: {child.profiles?.phone}
                    </p>
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600">Pickup: {child.pickup_address}</p>
                      <p className="text-gray-600">Drop: {child.drop_address}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rides History</CardTitle>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No rides completed yet.
            </p>
          ) : (
            <div className="space-y-4">
              {rides.slice(0, 5).map((ride: any) => (
                <div key={ride.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{ride.children?.name}</h4>
                    <p className="text-sm text-gray-600">
                      {ride.ride_date} at {ride.pickup_time}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ride.children?.school_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${
                      ride.status === 'dropped_off' ? 'bg-green-100 text-green-800' :
                      ride.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                      ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ride.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
