-- Enable RLS on folders table if not already enabled
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create policy for updating folders
CREATE POLICY "Users can update their own folders"
ON folders
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = ANY(
      ARRAY['dad@nini-family.com', 'mom@nini-family.com']
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = ANY(
      ARRAY['dad@nini-family.com', 'mom@nini-family.com']
    )
  )
); 