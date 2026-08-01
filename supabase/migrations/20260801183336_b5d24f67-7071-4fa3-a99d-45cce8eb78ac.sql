GRANT SELECT ON public.workshop_question_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_question_blocks TO authenticated;
GRANT ALL ON public.workshop_question_blocks TO service_role;

GRANT SELECT ON public.workshop_question_block_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_question_block_links TO authenticated;
GRANT ALL ON public.workshop_question_block_links TO service_role;

GRANT INSERT ON public.private_event_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_event_requests TO authenticated;
GRANT ALL ON public.private_event_requests TO service_role;