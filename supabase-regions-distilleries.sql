-- Regions and Distilleries tables for dropdown selections
-- Run this SQL in your Supabase SQL Editor after running the main schema

-- Regions table
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distilleries table
CREATE TABLE IF NOT EXISTS public.distilleries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, region_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_distilleries_region_id ON public.distilleries(region_id);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distilleries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.distilleries FOR SELECT USING (true);

-- Seed regions and distilleries
-- Scottish Regions
INSERT INTO public.regions (name) VALUES
    ('Speyside'),
    ('Highland'),
    ('Islay'),
    ('Lowland'),
    ('Campbeltown'),
    ('Islands')
ON CONFLICT (name) DO NOTHING;

-- Speyside Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Aberlour', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Balvenie', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Cardhu', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Cragganmore', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Glenfiddich', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Glenlivet', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Macallan', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Mortlach', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Strathisla', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Tamdhu', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Benromach', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Glenfarclas', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Glen Grant', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Glenrothes', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Knockando', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Linkwood', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Longmorn', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Dallas Dhu', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Imperial', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Caperdonich', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Coleburn', (SELECT id FROM public.regions WHERE name = 'Speyside')),
    ('Convalmore', (SELECT id FROM public.regions WHERE name = 'Speyside'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Highland Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Aberfeldy', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Clynelish', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Dalmore', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Glenmorangie', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Highland Park', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Oban', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Old Pulteney', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Royal Lochnagar', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Talisker', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Tomatin', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Brora', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Banff', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Glenugie', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Lochside', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('North Port', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Glenury Royal', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Glen Mhor', (SELECT id FROM public.regions WHERE name = 'Highland')),
    ('Millburn', (SELECT id FROM public.regions WHERE name = 'Highland'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Islay Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Ardbeg', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Bowmore', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Bruichladdich', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Bunnahabhain', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Caol Ila', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Kilchoman', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Lagavulin', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Laphroaig', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Port Charlotte', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Octomore', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Port Ellen', (SELECT id FROM public.regions WHERE name = 'Islay')),
    ('Lochindaal', (SELECT id FROM public.regions WHERE name = 'Islay'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Lowland Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Auchentoshan', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Bladnoch', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Glenkinchie', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Rosebank', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('St. Magdalene', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Littlemill', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Glen Flagler', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Kinclaith', (SELECT id FROM public.regions WHERE name = 'Lowland')),
    ('Ladyburn', (SELECT id FROM public.regions WHERE name = 'Lowland'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Campbeltown Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Glen Scotia', (SELECT id FROM public.regions WHERE name = 'Campbeltown')),
    ('Springbank', (SELECT id FROM public.regions WHERE name = 'Campbeltown')),
    ('Hazelburn', (SELECT id FROM public.regions WHERE name = 'Campbeltown'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Islands Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Highland Park', (SELECT id FROM public.regions WHERE name = 'Islands')),
    ('Jura', (SELECT id FROM public.regions WHERE name = 'Islands')),
    ('Talisker', (SELECT id FROM public.regions WHERE name = 'Islands')),
    ('Tobermory', (SELECT id FROM public.regions WHERE name = 'Islands'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Other Regions (for international whiskies)
INSERT INTO public.regions (name) VALUES
    ('Ireland'),
    ('Japan'),
    ('United States'),
    ('Canada'),
    ('Other')
ON CONFLICT (name) DO NOTHING;

-- Irish Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Bushmills', (SELECT id FROM public.regions WHERE name = 'Ireland')),
    ('Jameson', (SELECT id FROM public.regions WHERE name = 'Ireland')),
    ('Redbreast', (SELECT id FROM public.regions WHERE name = 'Ireland')),
    ('Tullamore D.E.W.', (SELECT id FROM public.regions WHERE name = 'Ireland')),
    ('Green Spot', (SELECT id FROM public.regions WHERE name = 'Ireland'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Japanese Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Yamazaki', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Hakushu', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Hibiki', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Nikka', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Suntory', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Yoichi', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Miyagikyo', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Chichibu', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Karuizawa', (SELECT id FROM public.regions WHERE name = 'Japan')),
    ('Hanyu', (SELECT id FROM public.regions WHERE name = 'Japan'))
ON CONFLICT (name, region_id) DO NOTHING;

-- United States Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Buffalo Trace', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Four Roses', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Jack Daniel''s', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Maker''s Mark', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Woodford Reserve', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Wild Turkey', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Eagle Rare', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Blanton''s', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Pappy Van Winkle', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Booker''s', (SELECT id FROM public.regions WHERE name = 'United States')),
    ('Knob Creek', (SELECT id FROM public.regions WHERE name = 'United States'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Canadian Distilleries
INSERT INTO public.distilleries (name, region_id) VALUES
    ('Crown Royal', (SELECT id FROM public.regions WHERE name = 'Canada')),
    ('Canadian Club', (SELECT id FROM public.regions WHERE name = 'Canada')),
    ('Forty Creek', (SELECT id FROM public.regions WHERE name = 'Canada'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Note: Some distilleries listed above are closed (e.g., Port Ellen, Brora, Rosebank, St. Magdalene, 
-- Dallas Dhu, Imperial, Caperdonich, Banff, etc.). These are included because their whiskies are still 
-- available through independent bottlers and collectors, and are often highly sought after in tastings.

