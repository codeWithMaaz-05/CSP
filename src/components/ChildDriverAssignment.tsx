
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, Car } from 'lucide-react';

const ChildDriverAssignment = () => {
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
    fetchDrivers();
  }, []);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select(`
          *,
          parent:profiles!children_parent_id_fkey (full_name),
          driver:profiles!children_assigned_driver_id_fkey (full_name)
        `)
        .order('name');
      
      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Failed to fetch children",
        variant: "destructive"
      });
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'driver')
        .order('full_name');
      
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive"
      });
    }
  };

  const assignDriver = async (childId: string, driverId: string | null) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .update({ assigned_driver_id: driverId })
        .eq('id', childId);

      if (error) throw error;

      toast({
        title: "Success",
        description: driverId 
          ? "Driver assigned successfully" 
          : "Driver unassigned successfully"
      });

      fetchChildren(); // Refresh the list
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Child-Driver Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Current Driver</TableHead>
              <TableHead>Assign Driver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {children.map((child: any) => (
              <TableRow key={child.id}>
                <TableCell className="font-medium">{child.name}</TableCell>
                <TableCell>{child.age}</TableCell>
                <TableCell>{child.school_name}</TableCell>
                <TableCell>{child.parent?.full_name}</TableCell>
                <TableCell>
                  {child.driver?.full_name ? (
                    <span className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      {child.driver.full_name}
                    </span>
                  ) : (
                    <span className="text-gray-500">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={child.assigned_driver_id || ""}
                    onValueChange={(value) => 
                      assignDriver(child.id, value === "" ? null : value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassign</SelectItem>
                      {drivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {children.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No children found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChildDriverAssignment;
