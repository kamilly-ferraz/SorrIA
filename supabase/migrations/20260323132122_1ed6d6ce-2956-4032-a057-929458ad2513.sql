-- Fix admin user: move to correct tenant
UPDATE profiles SET tenant_id = 'a175d532-4bc3-4399-a1dd-97b181b68166' 
WHERE user_id = '58dbfdfc-7484-4e8c-941a-d4e8fbe4bbb3';

-- Fix patient Gustavo: move to correct tenant and assign to admin who created it
UPDATE patients SET tenant_id = 'a175d532-4bc3-4399-a1dd-97b181b68166'
WHERE id = '465d48d5-4eb7-4d08-8829-df039921e7f7';

-- Fix patients with null dentist_id: assign to the only dentist in that tenant
UPDATE patients SET dentist_id = 'd01ca047-3305-4ce8-acae-14881e6e4d5e'
WHERE tenant_id = 'a175d532-4bc3-4399-a1dd-97b181b68166' AND dentist_id IS NULL;

-- Fix appointment with null dentist_id
UPDATE appointments SET dentist_id = 'd01ca047-3305-4ce8-acae-14881e6e4d5e'
WHERE tenant_id = 'a175d532-4bc3-4399-a1dd-97b181b68166' AND dentist_id IS NULL;

-- Ensure patient Gustavo also gets dentist_id
UPDATE patients SET dentist_id = '58dbfdfc-7484-4e8c-941a-d4e8fbe4bbb3'
WHERE id = '465d48d5-4eb7-4d08-8829-df039921e7f7' AND dentist_id IS NULL;