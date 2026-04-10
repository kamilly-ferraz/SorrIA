-- Add checked_in to appointment_status enum
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'checked_in' AFTER 'scheduled';