
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Car, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ParentDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [rides, setRides] = useState([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    age: '',
    school_name: '',
    pickup_address: '',
    drop_address: ''
  });

  useEffect(() => {
    fetchChildren();
    fetchRides();
  }, []);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userProfile.id);
      
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
          children:child_id (name, school_name),
          profiles:driver_id (full_name, phone)
        `)
        .order('ride_date', { ascending: false });
      
      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('children')
        .insert([
          {
            ...newChild,
            age: parseInt(newChild.age),
            parent_id: userProfile.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child added successfully!"
      });

      setNewChild({
        name: '',
        age: '',
        school_name: '',
        pickup_address: '',
        drop_address: ''
      });
      setShowAddChild(false);
      fetchChildren();
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
        <p className="text-gray-600">Manage your children and track their rides</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
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
            <CardTitle className="text-sm font-medium">Upcoming Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rides.filter(ride => new Date(ride.ride_date) >= new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Section */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Children</CardTitle>
          <Button onClick={() => setShowAddChild(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No children added yet. Click "Add Child" to get started.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {children.map((child: any) => (
                <Card key={child.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg">{child.name}</h3>
                    <p className="text-gray-600">Age: {child.age}</p>
                    <p className="text-gray-600">School: {child.school_name}</p>
                    <p className="text-gray-600 text-sm mt-2">
                      Pickup: {child.pickup_address}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Drop: {child.drop_address}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Child Form */}
      {showAddChild && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Child</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newChild.age}
                    onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="school_name">School Name</Label>
                <Input
                  id="school_name"
                  value={newChild.school_name}
                  onChange={(e) => setNewChild({ ...newChild, school_name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="pickup_address">Pickup Address</Label>
                <Input
                  id="pickup_address"
                  value={newChild.pickup_address}
                  onChange={(e) => setNewChild({ ...newChild, pickup_address: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="drop_address">Drop Address</Label>
                <Input
                  id="drop_address"
                  value={newChild.drop_address}
                  onChange={(e) => setNewChild({ ...newChild, drop_address: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit">Add Child</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddChild(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No rides yet.
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
                      Driver: {ride.profiles?.full_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${
                      ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                      ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ride.status}
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

export default ParentDashboard;
