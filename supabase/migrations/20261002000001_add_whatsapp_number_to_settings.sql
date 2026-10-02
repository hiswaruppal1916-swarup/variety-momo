-- Add whatsapp_number column to restaurant_settings table
ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '7827423777';
