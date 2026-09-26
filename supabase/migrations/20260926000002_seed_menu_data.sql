-- Seed Categories
INSERT INTO public.categories (slug, name, description, display_order, is_active)
VALUES
  ('chicken-momos', 'Chicken Momos', 'Classic Himalayan & street-style steamed chicken momos', 1, true),
  ('special-momos', 'Special Momos', 'Gondhoraj, Kabul Malai, Chocolate & Pizza fusion momos', 2, true),
  ('fried-momos', 'Fried Momos', 'Golden crispy fried dumplings served with garlic sauce', 3, true),
  ('crunchy-momos', 'Crunchy Momos', 'Double-crumb flake coated super crunchy momos', 4, true),
  ('afghani-momos', 'Afghani Momos', 'Rich cashew cream & roasted herb charcoal momos', 5, true),
  ('achari-momos', 'Achari Momos', 'Zesty pickled Indian achari spiced momos', 6, true),
  ('pan-fried', 'Pan Fried', 'Shallow griddle pan-fried and spicy gravy tossed momos', 7, true),
  ('tikka', 'Tikka', 'Charcoal roasted paneer and chicken tikkas', 8, true),
  ('rice', 'Fried Rice', 'High-flame wok tossed basmati rice specialties', 9, true),
  ('chowmein', 'Chowmein', 'Authentic Kolkata street-style wok noodles', 10, true),
  ('fast-food', 'Fast Food', 'Crispy sides, fries, and quick bites', 11, true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Seed Menu Items
INSERT INTO public.menu_items (category_id, name, slug, description, price, image_url, is_vegetarian, is_available, is_popular, display_order)
VALUES
  ((SELECT id FROM public.categories WHERE slug = 'chicken-momos'), 'Steam Chicken Momos', 'steam-chicken-momos', 'Classic Himalayan-style tender dumplings packed with finely minced juicy chicken, fresh ginger, spring onions, and served with house fiery red chutney & clear soup.', 70.00, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80', false, true, true, 1),
  ((SELECT id FROM public.categories WHERE slug = 'chicken-momos'), 'Chicken Fried Momos', 'chicken-fried-momos', 'Crispy golden-fried chicken momos with a crunchy exterior and succulent, steaming hot interior. Accompanied by zesty mayo and spicy garlic dips.', 80.00, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80', false, true, true, 2),
  ((SELECT id FROM public.categories WHERE slug = 'crunchy-momos'), 'Chicken Crunchy Momos', 'chicken-crunchy-momos', 'Double-coated with chef''s special spiced crispy crumb flake crust and deep-fried to golden perfection. Extra crunch in every single bite!', 90.00, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80', false, true, true, 3),
  ((SELECT id FROM public.categories WHERE slug = 'afghani-momos'), 'Chicken Afghani Momos', 'chicken-afghani-momos', 'Tandoori grilled chicken momos smothered in rich velvety cashew cream, butter, roasted herbs, and mild black pepper.', 110.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', false, true, false, 4),
  ((SELECT id FROM public.categories WHERE slug = 'achari-momos'), 'Chicken Achari Momos', 'chicken-achari-momos', 'Infused with tangy and zesty pickled Indian achari spices, mustard oil hint, and slow-roasted for a bold street flavor punch.', 100.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', false, true, false, 5),
  ((SELECT id FROM public.categories WHERE slug = 'chicken-momos'), 'Chicken Amlet Momos', 'chicken-amlet-momos', 'Innovative fusion special: juicy steamed chicken momos wrapped in a seasoned fluffy golden egg omelette, topped with melted cheese drizzle.', 90.00, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', false, true, false, 6),
  ((SELECT id FROM public.categories WHERE slug = 'special-momos'), 'Chicken Pizza Momos', 'chicken-pizza-momos', 'Baked with rich Italian marinara, loaded mozzarella cheese pull, oregano, chilli flakes, and tender chicken momo fillings inside.', 120.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', false, true, false, 7),
  ((SELECT id FROM public.categories WHERE slug = 'pan-fried'), 'Chilli Gravy Pan Fried Momos', 'chilli-gravy-pan-fried-momos', 'Pan-crisped chicken momos drenched in a thick Indo-Chinese chilli garlic gravy with diced bell peppers, onion petals, and scallions.', 110.00, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', false, true, true, 8),
  ((SELECT id FROM public.categories WHERE slug = 'special-momos'), 'Gondhoraj Momo', 'gondhoraj-momo', 'Variety Momo''s legendary Bengal specialty! Steamed dumplings infused with aromatic Bengal Gondhoraj lime zest and fragrant herbs. Refreshing, vibrant, and bursting with citrus aromatics.', 90.00, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80', false, true, true, 9),
  ((SELECT id FROM public.categories WHERE slug = 'special-momos'), 'Chocolate Momo', 'chocolate-momo', 'Decadent dessert dumplings stuffed with molten dark chocolate and roasted almond slivers, served warm with rich chocolate fudge drizzle.', 80.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', true, true, false, 10),
  ((SELECT id FROM public.categories WHERE slug = 'special-momos'), 'Kabul Malai Momos', 'kabul-malai-momos', 'Afghani-Kabuli inspired specialty coated in thick cream, roasted saffron, crushed cardamom, and butter gravy with charred garlic notes.', 120.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', false, true, false, 11),
  ((SELECT id FROM public.categories WHERE slug = 'pan-fried'), 'Pan Fried Momos (Tossed)', 'pan-fried-momos-dry', 'Shallow-fried on an iron griddle until bottom is blistered and crunchy, tossed with roasted sesame seeds, dark soy, and house chilli sauce.', 90.00, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', false, true, false, 12),
  ((SELECT id FROM public.categories WHERE slug = 'tikka'), 'Paneer Tikka', 'paneer-tikka', 'Soft fresh malai paneer cubes marinated in spiced yoghurt, Kashmiri degi mirch, and ajwain, skewered with bell peppers and roasted on charcoal.', 130.00, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', true, true, false, 13),
  ((SELECT id FROM public.categories WHERE slug = 'tikka'), 'Chicken Tikka', 'chicken-tikka', 'Boneless chicken chunks marinated in mustard oil, tandoori masala, and Greek yoghurt, roasted with smoky char edges and lemon butter basting.', 150.00, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', false, true, true, 14),
  ((SELECT id FROM public.categories WHERE slug = 'rice'), 'Veg Fried Rice', 'veg-fried-rice', 'Aromatic long-grain basmati rice wok-tossed on high flame with finely chopped carrots, French beans, bell peppers, and fresh scallions.', 90.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', true, true, false, 15),
  ((SELECT id FROM public.categories WHERE slug = 'rice'), 'Chicken Fried Rice', 'chicken-fried-rice', 'Fluffy basmati rice tossed with shredded juicy chicken, scrambled farm egg, garlic, light soya sauce, and crushed black peppercorns.', 120.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', false, true, true, 16),
  ((SELECT id FROM public.categories WHERE slug = 'chowmein'), 'Veg Chowmein', 'veg-chowmein', 'Classic Kolkata roadside street-style noodles tossed with crunchy shredded cabbage, julienned carrots, capsicum, and tangy chilli sauces.', 70.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', true, true, false, 17),
  ((SELECT id FROM public.categories WHERE slug = 'chowmein'), 'Paneer Chowmein', 'paneer-chowmein', 'Wok-tossed noodles generously tossed with pan-seared fresh cottage cheese cubes, crunchy onions, and spicy dark soya sauce glaze.', 90.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', true, true, false, 18),
  ((SELECT id FROM public.categories WHERE slug = 'chowmein'), 'Chicken Chowmein', 'chicken-chowmein', 'Signature Bengal-style chicken chowmein loaded with tender chicken shreds, scrambled eggs, green chillies, garlic, and special wok seasoning.', 100.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', false, true, true, 19)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_vegetarian = EXCLUDED.is_vegetarian,
  is_available = EXCLUDED.is_available,
  is_popular = EXCLUDED.is_popular,
  display_order = EXCLUDED.display_order;

-- Seed Offers
INSERT INTO public.offers (title, description, discount_type, discount_value, badge, is_active)
VALUES
  ('Free Delivery in Mecheda Hub', 'Enjoy free home delivery on all orders above ₹249 across Mecheda railway and college areas.', 'FREE_DELIVERY', 50.00, 'BEST DEAL', true),
  ('10% Off on Grand Momos Platter', 'Order any 3 or more momo varieties together and get an instant 10% discount automatically applied.', 'PERCENTAGE', 10.00, 'SAVINGS', true),
  ('Signature Gondhoraj Duo Special', 'Pair 1 Full Gondhoraj Momo with 1 Chicken Chowmein and get a complimentary fresh lime soda sip.', 'FLAT', 30.00, 'POPULAR PAIR', true)
ON CONFLICT DO NOTHING;

-- Seed Gallery
INSERT INTO public.gallery (title, description, image_url, display_order, is_active)
VALUES
  ('Hand-Pleated Dumplings Steaming', 'Fresh batches of momos steaming in bamboo and steel baskets every 15 minutes.', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80', 1, true),
  ('Crispy Double-Crumb Fry', 'Golden fried crunchy momos served with creamy garlic dip.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80', 2, true),
  ('Smoky Charcoal Tandoor Tikka', 'Charred paneer and chicken tikkas marinated in Kashmiri red chilli & curd.', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=900&q=80', 3, true),
  ('Indo-Chinese Sizzling Wok', 'High-flame Kolkata style chowmein and spicy schezwan toss.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80', 4, true),
  ('Signature Gondhoraj Platter', 'The fragrant lime momo platter that put Variety Momo on the map.', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=900&q=80', 5, true),
  ('Warm Cozy Ambiance', 'Clean, hygienic, and welcoming dining space for friends and families in Mecheda.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80', 6, true)
ON CONFLICT DO NOTHING;

-- Seed Approved Reviews
INSERT INTO public.reviews (customer_name, rating, review_text, is_approved)
VALUES
  ('Soumya Mukherjee', 5.0, 'The Gondhoraj momos here are unmatched in Mecheda! The aroma of Gondhoraj lime combined with hot juicy chicken mince and the spicy red chutney is purely addictive.', true),
  ('Rahul Adhikary', 5.0, 'Best crunchy momo experience! It''s so crisp on the outside and melts inside. The packing was clean and steaming hot even on home delivery.', true),
  ('Priyanka Mondal', 5.0, 'Chicken Afghani Momos and Chicken Chowmein are our regular evening combo. Rich, creamy, high quality, and very reasonably priced. Highly recommended!', true),
  ('Subhajit Roy', 5.0, 'Visited the restaurant with friends. Clean seating, quick service, and the Kabul Malai momos are pure indulgence. Can''t wait to visit again.', true)
ON CONFLICT DO NOTHING;
