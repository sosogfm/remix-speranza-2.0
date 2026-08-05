REVOKE EXECUTE ON FUNCTION public.cleanup_past_workshops() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_workshop_spots() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.grant_admin_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM anon;