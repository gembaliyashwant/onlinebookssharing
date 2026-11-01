ALTER TABLE public.resources ADD COLUMN uploaded_by text NOT NULL DEFAULT 'Student';

COMMENT ON COLUMN public.resources.uploaded_by IS 'Who uploaded the resource: Student, Faculty, or Other';

-- Preserve existing default grant pattern on resources
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
GRANT SELECT ON public.resources TO anon;