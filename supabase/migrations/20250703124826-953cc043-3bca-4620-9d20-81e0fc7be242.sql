
-- Create enum types for user roles and ride status
CREATE TYPE user_role AS ENUM ('parent', 'driver', 'admin');
CREATE TYPE ride_status AS ENUM ('scheduled', 'picked_up', 'dropped_off', 'cancelled');

-- Create profiles table for user management
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  school_name TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  assigned_driver_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  ride_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  drop_time TIME,
  status ride_status NOT NULL DEFAULT 'scheduled',
  pickup_address TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Children policies
CREATE POLICY "Parents can manage their own children" ON children
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Drivers can view assigned children" ON children
  FOR SELECT USING (assigned_driver_id = auth.uid());

CREATE POLICY "Admins can manage all children" ON children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rides policies
CREATE POLICY "Parents can view rides for their children" ON rides
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can manage their assigned rides" ON rides
  FOR ALL USING (driver_id = auth.uid());

CREATE POLICY "Admins can manage all rides" ON rides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert some sample data for demo
INSERT INTO profiles (id, email, full_name, phone, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'driver1@example.com', 'Rajesh Kumar', '+91-9876543210', 'driver'),
  ('22222222-2222-2222-2222-222222222222', 'driver2@example.com', 'Priya Sharma', '+91-9876543211', 'driver'),
  ('33333333-3333-3333-3333-333333333333', 'admin@example.com', 'Admin User', '+91-9876543212', 'admin');
