-- Remove 'sent' status from gallery status check constraint
-- The new workflow is: draft -> selection -> editing -> delivery_ready -> locked

-- Drop the existing check constraint
alter table public.galleries drop constraint galleries_status_check;

-- Add the new check constraint without 'sent'
alter table public.galleries 
  add constraint galleries_status_check 
  check (status in ('draft', 'selection', 'editing', 'delivery_ready', 'locked'));

-- Update any existing galleries with 'sent' status to 'selection'
update public.galleries 
set status = 'selection' 
where status = 'sent';
