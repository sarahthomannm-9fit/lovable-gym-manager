export const COMMON_AREAS: Record<string, string> = {
  academia: 'Academia', quadra: 'Quadra', piscina: 'Piscina',
  brinquedoteca: 'Brinquedoteca', salao: 'Salão', outro: 'Outra área',
};
export const RESIDENT_SERVICES: Record<string, string> = {
  personal: 'Personal trainer', nutricao: 'Nutrição', avaliacao: 'Avaliação física',
  aula_particular: 'Aula particular', evento: 'Evento privado',
};
export function catalogSelection(value: unknown, allowed: Record<string, string>): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id in allowed))] : [];
}
