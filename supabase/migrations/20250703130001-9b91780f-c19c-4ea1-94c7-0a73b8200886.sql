
-- Create profiles table to store user information
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  phone text,
  role text not null default 'parent' check (role in ('parent', 'driver', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create children table
CREATE TABLE public.children (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.profiles(id) on delete cascade not null,
  assigned_driver_id uuid references public.profiles(id) on delete set null,
  name text not null,
  age integer not null,
  school_name text not null,
  pickup_address text not null,
  drop_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create rides table
CREATE TABLE public.rides (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references public.children(id) on delete cascade not null,
  driver_id uuid references public.profiles(id) on delete cascade not null,
  ride_date date not null,
  pickup_time time not null,
  drop_time time,
  pickup_address text not null,
  drop_address text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'picked_up', 'dropped_off', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for children table
CREATE POLICY "Parents can view their children" ON public.children
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert their children" ON public.children
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update their children" ON public.children
  FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete their children" ON public.children
  FOR DELETE USING (parent_id = auth.uid());

CREATE POLICY "Drivers can view assigned children" ON public.children
  FOR SELECT USING (assigned_driver_id = auth.uid());

-- Create policies for rides table
CREATE POLICY "Users can view their rides" ON public.rides
  FOR SELECT USING (
    driver_id = auth.uid() OR 
    child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
  );

CREATE POLICY "Drivers can update their rides" ON public.rides
  FOR UPDATE USING (driver_id = auth.uid());

CREATE POLICY "System can insert rides" ON public.rides
  FOR INSERT WITH CHECK (true);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'parent')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
