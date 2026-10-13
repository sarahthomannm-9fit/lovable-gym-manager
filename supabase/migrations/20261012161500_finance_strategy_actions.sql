ALTER TABLE public.operational_delivery_cases DROP CONSTRAINT IF EXISTS operational_delivery_cases_module_key_check;
ALTER TABLE public.operational_delivery_cases ADD CONSTRAINT operational_delivery_cases_module_key_check
CHECK (module_key IN ('operacao','ceo','consultoria','concierge','trust','network','automacao','cfo','finance_strategy'));

