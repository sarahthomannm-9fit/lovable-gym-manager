CREATE OR REPLACE FUNCTION public.organization_protocol_readiness(p_organization_id UUID)
RETURNS TABLE(ready BOOLEAN, total_items INTEGER, approved_items INTEGER, pending_items INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) > 0 AND COUNT(*) FILTER (WHERE status = 'aprovado') = COUNT(*) AS ready,
    COUNT(*)::INTEGER AS total_items,
    COUNT(*) FILTER (WHERE status = 'aprovado')::INTEGER AS approved_items,
    COUNT(*) FILTER (WHERE status = 'pendente')::INTEGER AS pending_items
  FROM public.organization_facilities
  WHERE organization_id = p_organization_id
    AND status <> 'inativo';
$$;

REVOKE ALL ON FUNCTION public.organization_protocol_readiness(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organization_protocol_readiness(UUID) TO authenticated;
