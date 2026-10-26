import { ProfessionalRequestsBoard } from '@/components/admin/ProfessionalRequestsBoard';
import { CommonAreaOperations } from '@/components/admin/CommonAreaOperations';
import { PersonaLayout,PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { SupportTickets } from '@/components/SupportTickets';
import { ServiceRequestsBoard } from '@/components/admin/ServiceRequestsBoard';
export default function Requests(){
  const {activeOrg}=useOperationalContext();
  return <PersonaLayout title="Solicitações e atendimento">{activeOrg?<div className="space-y-6"><CommonAreaOperations orgId={activeOrg.id}/><SupportTickets orgId={activeOrg.id} manage/><ServiceRequestsBoard orgId={activeOrg.id}/><ProfessionalRequestsBoard orgId={activeOrg.id}/></div>:<PersonaEmptyState/>}</PersonaLayout>;
}
