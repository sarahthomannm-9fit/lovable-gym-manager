INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-facilities', 'organization-facilities', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "facility_photo_read" ON storage.objects;
CREATE POLICY "facility_photo_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'organization-facilities');

DROP POLICY IF EXISTS "facility_photo_write" ON storage.objects;
CREATE POLICY "facility_photo_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'organization-facilities');

DROP POLICY IF EXISTS "facility_photo_update" ON storage.objects;
CREATE POLICY "facility_photo_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'organization-facilities')
WITH CHECK (bucket_id = 'organization-facilities');
