-- Add cover_photo_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'folders' 
        AND column_name = 'cover_photo_id'
    ) THEN
        ALTER TABLE folders ADD COLUMN cover_photo_id UUID REFERENCES photos(id);
    END IF;
END $$;

-- Create function to add cover_photo_id column
CREATE OR REPLACE FUNCTION add_cover_photo_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'folders' 
        AND column_name = 'cover_photo_id'
    ) THEN
        ALTER TABLE folders ADD COLUMN cover_photo_id UUID REFERENCES photos(id);
    END IF;
END;
$$; 