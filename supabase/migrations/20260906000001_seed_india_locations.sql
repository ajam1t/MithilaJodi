-- ============================================================================
-- Seed india_locations with the rest of India.
--
-- WHY: before this migration the table held 38 rows — 1 country, 22 states and
-- 15 Bihar districts. There was not a single row at level 'city'. The profile
-- editor's location picker only lets you save a location you pick from its
-- suggestion list, so "Current Location" and "Work Location" were impossible to
-- fill in for anyone living in a city: typing "Mumbai" or "Thane" returned zero
-- suggestions, no id was ever set, and the field silently stayed empty. Every
-- profile in production had current_loc_id IS NULL and job_loc_id IS NULL.
--
-- Also adds latitude/longitude everywhere, which is what the "no exact match —
-- here is what is nearby" fallback in search is built on.
--
-- Idempotent: every insert is guarded by NOT EXISTS on (level, lower(name_en),
-- state_code), so re-running changes nothing.
-- ============================================================================

-- ─── 0. Fix an existing typo before it collides with the correct spelling ────
update public.india_locations set name_en = 'Saharsa'
 where level = 'district' and name_en = 'Saharsaa';

-- ─── 1. Coordinates for the rows that already exist ──────────────────────────
update public.india_locations l set latitude = v.lat, longitude = v.lon
from (values
  ('India',            20.5937, 78.9629),
  ('Andhra Pradesh',   15.9129, 79.7400),
  ('Assam',            26.2006, 92.9376),
  ('Bihar',            25.0961, 85.3131),
  ('Chhattisgarh',     21.2787, 81.8661),
  ('Delhi',            28.7041, 77.1025),
  ('Goa',              15.2993, 74.1240),
  ('Gujarat',          22.2587, 71.1924),
  ('Haryana',          29.0588, 76.0856),
  ('Himachal Pradesh', 31.1048, 77.1734),
  ('Jharkhand',        23.6102, 85.2799),
  ('Karnataka',        15.3173, 75.7139),
  ('Kerala',           10.8505, 76.2711),
  ('Madhya Pradesh',   22.9734, 78.6569),
  ('Maharashtra',      19.7515, 75.7139),
  ('Odisha',           20.9517, 85.0985),
  ('Punjab',           31.1471, 75.3412),
  ('Rajasthan',        27.0238, 74.2179),
  ('Tamil Nadu',       11.1271, 78.6569),
  ('Telangana',        18.1124, 79.0193),
  ('Uttar Pradesh',    26.8467, 80.9462),
  ('Uttarakhand',      30.0668, 79.0193),
  ('West Bengal',      22.9868, 87.8550),
  ('Begusarai',        25.4182, 86.1272),
  ('Bhagalpur',        25.2425, 86.9842),
  ('Darbhanga',        26.1542, 85.8918),
  ('Gaya',             24.7955, 85.0002),
  ('Khagaria',         25.5022, 86.4671),
  ('Madhepura',        25.9210, 86.7906),
  ('Madhubani',        26.3477, 86.0713),
  ('Muzaffarpur',      26.1209, 85.3647),
  ('Nalanda',          25.1372, 85.4438),
  ('Patna',            25.5941, 85.1376),
  ('Purnea',           25.7771, 87.4753),
  ('Saharsa',          25.8801, 86.5994),
  ('Samastipur',       25.8560, 85.7810),
  ('Sitamarhi',        26.5947, 85.4906),
  ('Supaul',           26.1260, 86.6050)
) as v(name, lat, lon)
where l.name_en = v.name and l.latitude is null;

-- ─── 2. States and union territories that were missing ───────────────────────
insert into public.india_locations (parent_id, level, name_en, state_code, is_mithila_region, latitude, longitude)
select c.id, 'state', v.name, v.code, false, v.lat, v.lon
from (values
  ('Arunachal Pradesh',                        'IN-AR', 28.2180, 94.7278),
  ('Manipur',                                  'IN-MN', 24.6637, 93.9063),
  ('Meghalaya',                                'IN-ML', 25.4670, 91.3662),
  ('Mizoram',                                  'IN-MZ', 23.1645, 92.9376),
  ('Nagaland',                                 'IN-NL', 26.1584, 94.5624),
  ('Sikkim',                                   'IN-SK', 27.5330, 88.5122),
  ('Tripura',                                  'IN-TR', 23.9408, 91.9882),
  ('Jammu and Kashmir',                        'IN-JK', 33.7782, 76.5762),
  ('Ladakh',                                   'IN-LA', 34.2268, 77.5619),
  ('Chandigarh',                               'IN-CH', 30.7333, 76.7794),
  ('Puducherry',                               'IN-PY', 11.9416, 79.8083),
  ('Andaman and Nicobar Islands',              'IN-AN', 11.7401, 92.6586),
  ('Dadra and Nagar Haveli and Daman and Diu', 'IN-DH', 20.3974, 72.8328),
  ('Lakshadweep',                              'IN-LD', 10.5667, 72.6417)
) as v(name, code, lat, lon)
cross join lateral (select id from public.india_locations where level = 'country' limit 1) c
where not exists (
  select 1 from public.india_locations x
  where x.level = 'state' and lower(x.name_en) = lower(v.name)
);

-- ─── 3. All remaining Bihar districts ────────────────────────────────────────
-- is_mithila_region follows the Maithili-speaking cultural region rather than
-- any administrative division, which is why e.g. Vaishali is true and Rohtas is
-- not. Existing rows are left exactly as they were.
insert into public.india_locations (parent_id, level, name_en, state_code, is_mithila_region, latitude, longitude)
select s.id, 'district', v.name, 'IN-BR', v.mithila, v.lat, v.lon
from (values
  ('Araria',           true,  26.1497, 87.5150),
  ('Arwal',            false, 25.2410, 84.6820),
  ('Aurangabad',       false, 24.7521, 84.3742),
  ('Banka',            false, 24.8879, 86.9199),
  ('Bhojpur',          false, 25.5560, 84.6600),
  ('Buxar',            false, 25.5647, 83.9780),
  ('East Champaran',   false, 26.6485, 84.9160),
  ('Gopalganj',        false, 26.4670, 84.4390),
  ('Jamui',            false, 24.9260, 86.2250),
  ('Jehanabad',        false, 25.2130, 84.9870),
  ('Kaimur',           false, 25.0430, 83.6100),
  ('Katihar',          false, 25.5390, 87.5710),
  ('Kishanganj',       false, 26.1020, 87.9450),
  ('Lakhisarai',       false, 25.1720, 86.0950),
  ('Munger',           false, 25.3746, 86.4737),
  ('Nawada',           false, 24.8870, 85.5430),
  ('Rohtas',           false, 24.9560, 84.0200),
  ('Saran',            false, 25.7810, 84.7470),
  ('Sheikhpura',       false, 25.1400, 85.8510),
  ('Sheohar',          true,  26.5150, 85.2950),
  ('Siwan',            false, 26.2200, 84.3560),
  ('Vaishali',         true,  25.6890, 85.2130),
  ('West Champaran',   false, 27.0400, 84.5100)
) as v(name, mithila, lat, lon)
cross join lateral (select id from public.india_locations where level = 'state' and name_en = 'Bihar' limit 1) s
where not exists (
  select 1 from public.india_locations x
  where x.level = 'district' and lower(x.name_en) = lower(v.name) and x.state_code = 'IN-BR'
);

-- ─── 4. Cities ───────────────────────────────────────────────────────────────
-- The set people actually type into "Current Location" and "Work Location":
-- every metro, every state capital, and the tier-2/tier-3 cities with a real
-- Maithil diaspora. Bihar's own towns are included because "Current Location"
-- for someone at home is a town, not a district headquarters.
insert into public.india_locations (parent_id, level, name_en, state_code, is_mithila_region, latitude, longitude)
select s.id, 'city', v.name, v.code, v.mithila, v.lat, v.lon
from (values
  -- Maharashtra
  ('Mumbai',            'IN-MH', false, 19.0760, 72.8777),
  ('Navi Mumbai',       'IN-MH', false, 19.0330, 73.0297),
  ('Thane',             'IN-MH', false, 19.2183, 72.9781),
  ('Kalyan',            'IN-MH', false, 19.2437, 73.1355),
  ('Vasai-Virar',       'IN-MH', false, 19.3919, 72.8397),
  ('Pune',              'IN-MH', false, 18.5204, 73.8567),
  ('Pimpri-Chinchwad',  'IN-MH', false, 18.6279, 73.8009),
  ('Nagpur',            'IN-MH', false, 21.1458, 79.0882),
  ('Nashik',            'IN-MH', false, 19.9975, 73.7898),
  ('Aurangabad (MH)',   'IN-MH', false, 19.8762, 75.3433),
  ('Solapur',           'IN-MH', false, 17.6599, 75.9064),
  ('Kolhapur',          'IN-MH', false, 16.7050, 74.2433),
  -- Delhi NCR
  ('New Delhi',         'IN-DL', false, 28.6139, 77.2090),
  ('Dwarka',            'IN-DL', false, 28.5921, 77.0460),
  ('Rohini',            'IN-DL', false, 28.7495, 77.0565),
  ('Noida',             'IN-UP', false, 28.5355, 77.3910),
  ('Greater Noida',     'IN-UP', false, 28.4744, 77.5040),
  ('Ghaziabad',         'IN-UP', false, 28.6692, 77.4538),
  ('Gurugram',          'IN-HR', false, 28.4595, 77.0266),
  ('Faridabad',         'IN-HR', false, 28.4089, 77.3178),
  -- Karnataka
  ('Bengaluru',         'IN-KA', false, 12.9716, 77.5946),
  ('Mysuru',            'IN-KA', false, 12.2958, 76.6394),
  ('Mangaluru',         'IN-KA', false, 12.9141, 74.8560),
  ('Hubballi',          'IN-KA', false, 15.3647, 75.1240),
  ('Belagavi',          'IN-KA', false, 15.8497, 74.4977),
  -- Telangana / Andhra Pradesh
  ('Hyderabad',         'IN-TS', false, 17.3850, 78.4867),
  ('Secunderabad',      'IN-TS', false, 17.4399, 78.4983),
  ('Warangal',          'IN-TS', false, 17.9689, 79.5941),
  ('Visakhapatnam',     'IN-AP', false, 17.6868, 83.2185),
  ('Vijayawada',        'IN-AP', false, 16.5062, 80.6480),
  ('Guntur',            'IN-AP', false, 16.3067, 80.4365),
  ('Tirupati',          'IN-AP', false, 13.6288, 79.4192),
  -- Tamil Nadu / Puducherry
  ('Chennai',           'IN-TN', false, 13.0827, 80.2707),
  ('Coimbatore',        'IN-TN', false, 11.0168, 76.9558),
  ('Madurai',           'IN-TN', false,  9.9252, 78.1198),
  ('Tiruchirappalli',   'IN-TN', false, 10.7905, 78.7047),
  ('Salem',             'IN-TN', false, 11.6643, 78.1460),
  ('Puducherry (City)', 'IN-PY', false, 11.9416, 79.8083),
  -- Kerala
  ('Kochi',             'IN-KL', false,  9.9312, 76.2673),
  ('Thiruvananthapuram','IN-KL', false,  8.5241, 76.9366),
  ('Kozhikode',         'IN-KL', false, 11.2588, 75.7804),
  ('Thrissur',          'IN-KL', false, 10.5276, 76.2144),
  -- West Bengal
  ('Kolkata',           'IN-WB', false, 22.5726, 88.3639),
  ('Howrah',            'IN-WB', false, 22.5958, 88.2636),
  ('Siliguri',          'IN-WB', false, 26.7271, 88.3953),
  ('Durgapur',          'IN-WB', false, 23.5204, 87.3119),
  ('Asansol',           'IN-WB', false, 23.6739, 86.9524),
  ('Kharagpur',         'IN-WB', false, 22.3460, 87.2320),
  -- Gujarat
  ('Ahmedabad',         'IN-GJ', false, 23.0225, 72.5714),
  ('Surat',             'IN-GJ', false, 21.1702, 72.8311),
  ('Vadodara',          'IN-GJ', false, 22.3072, 73.1812),
  ('Rajkot',            'IN-GJ', false, 22.3039, 70.8022),
  ('Gandhinagar',       'IN-GJ', false, 23.2156, 72.6369),
  ('Bharuch',           'IN-GJ', false, 21.7051, 72.9959),
  -- Rajasthan
  ('Jaipur',            'IN-RJ', false, 26.9124, 75.7873),
  ('Jodhpur',           'IN-RJ', false, 26.2389, 73.0243),
  ('Udaipur',           'IN-RJ', false, 24.5854, 73.7125),
  ('Kota',              'IN-RJ', false, 25.2138, 75.8648),
  ('Ajmer',             'IN-RJ', false, 26.4499, 74.6399),
  ('Bikaner',           'IN-RJ', false, 28.0229, 73.3119),
  -- Uttar Pradesh
  ('Lucknow',           'IN-UP', false, 26.8467, 80.9462),
  ('Kanpur',            'IN-UP', false, 26.4499, 80.3319),
  ('Varanasi',          'IN-UP', false, 25.3176, 82.9739),
  ('Prayagraj',         'IN-UP', false, 25.4358, 81.8463),
  ('Agra',              'IN-UP', false, 27.1767, 78.0081),
  ('Meerut',            'IN-UP', false, 28.9845, 77.7064),
  ('Gorakhpur',         'IN-UP', false, 26.7606, 83.3732),
  ('Bareilly',          'IN-UP', false, 28.3670, 79.4304),
  ('Aligarh',           'IN-UP', false, 27.8974, 78.0880),
  ('Mathura',           'IN-UP', false, 27.4924, 77.6737),
  ('Jhansi',            'IN-UP', false, 25.4484, 78.5685),
  ('Ayodhya',           'IN-UP', false, 26.7922, 82.1998),
  -- Madhya Pradesh / Chhattisgarh
  ('Bhopal',            'IN-MP', false, 23.2599, 77.4126),
  ('Indore',            'IN-MP', false, 22.7196, 75.8577),
  ('Jabalpur',          'IN-MP', false, 23.1815, 79.9864),
  ('Gwalior',           'IN-MP', false, 26.2183, 78.1828),
  ('Ujjain',            'IN-MP', false, 23.1765, 75.7885),
  ('Raipur',            'IN-CT', false, 21.2514, 81.6296),
  ('Bhilai',            'IN-CT', false, 21.1938, 81.3509),
  ('Bilaspur',          'IN-CT', false, 22.0797, 82.1409),
  -- Punjab / Haryana / Chandigarh / HP / J&K / Uttarakhand
  ('Ludhiana',          'IN-PB', false, 30.9010, 75.8573),
  ('Amritsar',          'IN-PB', false, 31.6340, 74.8723),
  ('Jalandhar',         'IN-PB', false, 31.3260, 75.5762),
  ('Mohali',            'IN-PB', false, 30.7046, 76.7179),
  ('Chandigarh (City)', 'IN-CH', false, 30.7333, 76.7794),
  ('Panchkula',         'IN-HR', false, 30.6942, 76.8606),
  ('Ambala',            'IN-HR', false, 30.3752, 76.7821),
  ('Karnal',            'IN-HR', false, 29.6857, 76.9905),
  ('Hisar',             'IN-HR', false, 29.1492, 75.7217),
  ('Shimla',            'IN-HP', false, 31.1048, 77.1734),
  ('Baddi',             'IN-HP', false, 30.9578, 76.7914),
  ('Jammu',             'IN-JK', false, 32.7266, 74.8570),
  ('Srinagar',          'IN-JK', false, 34.0837, 74.7973),
  ('Dehradun',          'IN-UK', false, 30.3165, 78.0322),
  ('Haridwar',          'IN-UK', false, 29.9457, 78.1642),
  ('Rudrapur',          'IN-UK', false, 28.9845, 79.4004),
  ('Haldwani',          'IN-UK', false, 29.2183, 79.5130),
  -- Odisha / Assam / North East
  ('Bhubaneswar',       'IN-OR', false, 20.2961, 85.8245),
  ('Cuttack',           'IN-OR', false, 20.4625, 85.8830),
  ('Rourkela',          'IN-OR', false, 22.2604, 84.8536),
  ('Puri',              'IN-OR', false, 19.8135, 85.8312),
  ('Guwahati',          'IN-AS', false, 26.1445, 91.7362),
  ('Dibrugarh',         'IN-AS', false, 27.4728, 94.9120),
  ('Silchar',           'IN-AS', false, 24.8333, 92.7789),
  ('Shillong',          'IN-ML', false, 25.5788, 91.8933),
  ('Imphal',            'IN-MN', false, 24.8170, 93.9368),
  ('Aizawl',            'IN-MZ', false, 23.7271, 92.7176),
  ('Kohima',            'IN-NL', false, 25.6751, 94.1086),
  ('Itanagar',          'IN-AR', false, 27.0844, 93.6053),
  ('Agartala',          'IN-TR', false, 23.8315, 91.2868),
  ('Gangtok',           'IN-SK', false, 27.3314, 88.6138),
  -- Goa
  ('Panaji',            'IN-GA', false, 15.4909, 73.8278),
  ('Margao',            'IN-GA', false, 15.2832, 73.9862),
  -- Jharkhand (large Maithil population)
  ('Ranchi',            'IN-JH', false, 23.3441, 85.3096),
  ('Jamshedpur',        'IN-JH', false, 22.8046, 86.2029),
  ('Dhanbad',           'IN-JH', false, 23.7957, 86.4304),
  ('Bokaro Steel City', 'IN-JH', false, 23.6693, 86.1511),
  ('Deoghar',           'IN-JH', false, 24.4823, 86.6996),
  ('Hazaribagh',        'IN-JH', false, 23.9925, 85.3637),
  ('Ramgarh',           'IN-JH', false, 23.6300, 85.5600),
  -- Bihar towns and cities (level 'city' so they sit under the district rows)
  ('Patna City',        'IN-BR', false, 25.6000, 85.2100),
  ('Danapur',           'IN-BR', false, 25.6350, 85.0480),
  ('Bihar Sharif',      'IN-BR', false, 25.2000, 85.5200),
  ('Ara',               'IN-BR', false, 25.5560, 84.6600),
  ('Chapra',            'IN-BR', false, 25.7810, 84.7470),
  ('Bettiah',           'IN-BR', false, 26.8020, 84.5030),
  ('Motihari',          'IN-BR', false, 26.6485, 84.9160),
  ('Hajipur',           'IN-BR', true,  25.6860, 85.2090),
  ('Sasaram',           'IN-BR', false, 24.9560, 84.0200),
  ('Dehri',             'IN-BR', false, 24.9040, 84.1830),
  ('Kishanganj (Town)', 'IN-BR', false, 26.1020, 87.9450),
  ('Jhanjharpur',       'IN-BR', true,  26.2650, 86.2800),
  ('Benipatti',         'IN-BR', true,  26.4340, 85.9540),
  ('Jaynagar',          'IN-BR', true,  26.5900, 86.1370),
  ('Rajnagar',          'IN-BR', true,  26.4160, 86.1670),
  ('Laukaha',           'IN-BR', true,  26.5850, 86.4590),
  ('Phulparas',         'IN-BR', true,  26.3560, 86.4180),
  ('Sakri',             'IN-BR', true,  26.2350, 86.0670),
  ('Pandaul',           'IN-BR', true,  26.2360, 86.0670),
  ('Laheriasarai',      'IN-BR', true,  26.1400, 85.9000),
  ('Benipur',           'IN-BR', true,  26.2500, 86.0000),
  ('Biraul',            'IN-BR', true,  25.9500, 86.1000),
  ('Rosera',            'IN-BR', true,  25.7500, 86.0300),
  ('Dalsinghsarai',     'IN-BR', true,  25.6700, 85.8300),
  ('Pusa',              'IN-BR', true,  25.9700, 85.6700),
  ('Sonepur',           'IN-BR', false, 25.7000, 85.1800),
  ('Barauni',           'IN-BR', true,  25.4700, 85.9700),
  ('Bagaha',            'IN-BR', false, 27.1000, 84.0900),
  ('Jhajha',            'IN-BR', false, 24.7700, 86.3800),
  ('Sultanganj',        'IN-BR', false, 25.2500, 86.7300),
  ('Naugachhia',        'IN-BR', false, 25.3900, 87.1000),
  ('Forbesganj',        'IN-BR', true,  26.3000, 87.2600),
  ('Birpur',            'IN-BR', true,  26.5100, 87.0000),
  ('Nirmali',           'IN-BR', true,  26.3100, 86.5800),
  ('Simri Bakhtiarpur', 'IN-BR', true,  25.7300, 86.6000),
  ('Belsand',           'IN-BR', true,  26.4400, 85.4000),
  ('Pupri',             'IN-BR', true,  26.4700, 85.7000),
  ('Runnisaidpur',      'IN-BR', true,  26.4200, 85.5100),
  ('Barh',              'IN-BR', false, 25.4800, 85.7100),
  ('Mokama',            'IN-BR', false, 25.4000, 85.9200),
  ('Khagaul',           'IN-BR', false, 25.5800, 85.0500)
) as v(name, code, mithila, lat, lon)
join public.india_locations s on s.level = 'state' and s.state_code = v.code
where not exists (
  select 1 from public.india_locations x
  where x.level = 'city' and lower(x.name_en) = lower(v.name) and x.state_code = v.code
);

-- ─── 5. Indexes the location picker and the nearby-search fallback rely on ───
create index if not exists idx_india_locations_name_trgm
  on public.india_locations using gin (name_en gin_trgm_ops);
create index if not exists idx_india_locations_level_name
  on public.india_locations (level, name_en);
create index if not exists idx_india_locations_latlon
  on public.india_locations (latitude, longitude)
  where latitude is not null;
