-- Sample Data for Testing
-- Note: Insert sample charities and basic structure for development

-- Insert sample charities
INSERT INTO charities (name, description, image_url, website, impact_area, region, is_featured, is_spotlight)
VALUES
  (
    'Global Green Initiative',
    'Dedicated to reforestation and climate action across 50+ countries. We plant trees, restore habitats, and support local communities.',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    'https://globalgreen.example.com',
    'Environment & Climate',
    'Global',
    true,
    true
  ),
  (
    'Water for All',
    'Building clean water infrastructure in underserved communities. Every drop counts.',
    'https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=400',
    'https://waterforall.example.com',
    'Water & Sanitation',
    'Africa, Asia',
    true,
    false
  ),
  (
    'Education Empowers',
    'Providing scholarships and educational resources to underprivileged youth worldwide.',
    'https://images.unsplash.com/photo-1427504494785-cdaf8faf00f1?w=400',
    'https://educationempowers.example.com',
    'Education',
    'Global',
    true,
    false
  ),
  (
    'Healthcare Heroes',
    'Mobile clinics and medical training in rural areas. Healthcare is a human right.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
    'https://healthcareheroes.example.com',
    'Healthcare',
    'Latin America, Africa',
    false,
    false
  ),
  (
    'Poverty Fighters',
    'Microfinance and livelihood training for families living in poverty.',
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400',
    'https://povertyfighters.example.com',
    'Economic Development',
    'South Asia, Africa',
    false,
    false
  ),
  (
    'Wildlife Protection Fund',
    'Protecting endangered species and their habitats for future generations.',
    'https://images.unsplash.com/photo-1453227427063-bf1a42265f8d?w=400',
    'https://wildlifeprotection.example.com',
    'Biodiversity & Conservation',
    'Global',
    false,
    false
  ),
  (
    'Children First Foundation',
    'Providing nutrition, shelter, and care for vulnerable children worldwide.',
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400',
    'https://childrenfirst.example.com',
    'Child Welfare',
    'Global',
    false,
    true
  ),
  (
    'Disaster Relief Coalition',
    'Rapid response to natural disasters with emergency aid and rebuilding support.',
    'https://images.unsplash.com/photo-1569163139394-de4798aa62b1?w=400',
    'https://disasterrelief.example.com',
    'Disaster Relief',
    'Global',
    false,
    false
  )
ON CONFLICT DO NOTHING;

-- Insert initial draw data (example for current month)
INSERT INTO draws (draw_month, draw_numbers, status, total_participants)
VALUES
  (
    (DATE_TRUNC('month', CURRENT_DATE))::date,
    ARRAY[15, 28, 7, 42, 33],
    'published',
    150
  )
ON CONFLICT DO NOTHING;

-- Note: Additional sample user data would be inserted via the authentication flow
-- This prevents direct user creation bypassing auth system
