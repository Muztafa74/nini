-- Add cover_photo_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'folders' 
        AND column_name = 'cover_photo_id'
    ) THEN
        ALTER TABLE folders 
        ADD COLUMN cover_photo_id UUID;
        
        -- Add foreign key constraint after column is added
        ALTER TABLE folders
        ADD CONSTRAINT fk_cover_photo
        FOREIGN KEY (cover_photo_id)
        REFERENCES photos(id)
        ON DELETE SET NULL;
    END IF;
END $$; 