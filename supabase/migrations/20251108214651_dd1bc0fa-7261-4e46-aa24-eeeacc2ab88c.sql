-- Create churches table
CREATE TABLE public.churches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  pastor_name TEXT,
  phone_number TEXT,
  email TEXT,
  established_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create church_members table
CREATE TABLE public.church_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
  role TEXT DEFAULT 'member',
  gender TEXT,
  date_of_birth DATE,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create church_resources table
CREATE TABLE public.church_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition TEXT DEFAULT 'good',
  description TEXT,
  acquired_date DATE,
  value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for churches
CREATE POLICY "Admins can manage all churches"
ON public.churches
FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

CREATE POLICY "Anyone can view churches"
ON public.churches
FOR SELECT
USING (true);

-- Create policies for church_members
CREATE POLICY "Admins can manage all church members"
ON public.church_members
FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

CREATE POLICY "Anyone can view church members"
ON public.church_members
FOR SELECT
USING (true);

-- Create policies for church_resources
CREATE POLICY "Admins can manage all church resources"
ON public.church_resources
FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

CREATE POLICY "Anyone can view church resources"
ON public.church_resources
FOR SELECT
USING (true);

-- Add trigger for updated_at on churches
CREATE TRIGGER update_churches_updated_at
BEFORE UPDATE ON public.churches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on church_members
CREATE TRIGGER update_church_members_updated_at
BEFORE UPDATE ON public.church_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on church_resources
CREATE TRIGGER update_church_resources_updated_at
BEFORE UPDATE ON public.church_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_church_members_church_id ON public.church_members(church_id);
CREATE INDEX idx_church_resources_church_id ON public.church_resources(church_id);
CREATE INDEX idx_churches_location ON public.churches(location);