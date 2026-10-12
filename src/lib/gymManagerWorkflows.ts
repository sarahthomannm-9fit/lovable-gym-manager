export type WorkflowApproval = 'none' | 'professor' | 'sindico' | 'admin';

export type GymManagerWorkflow = {
  key: string;
  ownerAgent: string;
  triggers: string[];
  approval: WorkflowApproval;
  metrics: string[];
};

export const GYM_MANAGER_WORKFLOWS: GymManagerWorkflow[] = [
  { key: 'condominium_activation', ownerAgent: 'implantacao', triggers: ['contract_signed'], approval: 'sindico', metrics: ['time_to_operational'] },
  { key: 'resident_activation', ownerAgent: 'ativacao', triggers: ['invite_sent', 'qr_scanned', 'onboarding_abandoned'], approval: 'none', metrics: ['onboarding_rate', 'first_checkin'] },
  { key: 'prescription_safety', ownerAgent: 'seguranca', triggers: ['triage_completed', 'triage_updated'], approval: 'professor', metrics: ['review_time', 'blocked_risk_cases'] },
  { key: 'daily_workout', ownerAgent: 'protocolo', triggers: ['onboarding_approved', 'workout_completed'], approval: 'professor', metrics: ['delivery_rate', 'completion_rate'] },
  { key: 'feedback_adaptation', ownerAgent: 'adaptacao', triggers: ['feedback_recorded'], approval: 'professor', metrics: ['pain_flags', 'next_workout_rate'] },
  { key: 'health_day', ownerAgent: 'health_day', triggers: ['event_created', 'capacity_near_limit'], approval: 'sindico', metrics: ['registrations', 'checkins'] },
  { key: 'operational_monitoring', ownerAgent: 'monitoramento', triggers: ['rpc_error', 'job_failed', 'activation_drop'], approval: 'admin', metrics: ['failure_rate', 'resolution_time'] },
  { key: 'renewal_retention', ownerAgent: 'retencao', triggers: ['trial_expiring', 'day_90'], approval: 'sindico', metrics: ['renewal_rate', 'churn_rate'] },
];

export function workflowByKey(key: string) {
  return GYM_MANAGER_WORKFLOWS.find((workflow) => workflow.key === key);
}
