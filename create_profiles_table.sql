-- STEP 1: CREATE TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
full_name text,
username text,
avatar_url text,
created_at timestamptz DEFAULT now()
);

-- STEP 2: ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: ADD POLICIES

-- SELECT
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- INSERT
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
