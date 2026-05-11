-- STEP 1: Enable RLS
ALTER TABLE public.clothes ENABLE ROW LEVEL SECURITY;

-- STEP 2: REMOVE ALL EXISTING POLICIES
DROP POLICY IF EXISTS "Users can view their own clothes" ON public.clothes;
DROP POLICY IF EXISTS "Users can insert their own clothes" ON public.clothes;
DROP POLICY IF EXISTS "Users can update their own clothes" ON public.clothes;
DROP POLICY IF EXISTS "Users can delete their own clothes" ON public.clothes;

-- STEP 3: CREATE CORRECT POLICIES

-- SELECT
CREATE POLICY "Users can view their own clothes"
ON public.clothes
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own clothes"
ON public.clothes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own clothes"
ON public.clothes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own clothes"
ON public.clothes
FOR DELETE
USING (auth.uid() = user_id);
