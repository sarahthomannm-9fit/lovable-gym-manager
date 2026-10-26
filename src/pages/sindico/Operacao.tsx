import { PersonaLayout, PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { CommonAreaOperations } from '@/components/admin/CommonAreaOperations';
import { ServiceRequestsBoard } from '@/components/admin/ServiceRequestsBoard';
import { SupportTickets } from '@/components/SupportTickets';
export default function SindicoOperacao() {
  const { activeOrg } = useOperationalContext();
  return <PersonaLayout title="Áreas, serviços e atendimento" subtitle={activeOrg?.nome || ''}>{activeOrg ? <div className="space-y-6"><CommonAreaOperations orgId={activeOrg.id}/><ServiceRequestsBoard orgId={activeOrg.id}/><SupportTickets orgId={activeOrg.id} manage/></div> : <PersonaEmptyState/>}</PersonaLayout>;
}
