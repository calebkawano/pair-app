-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for households
create table households (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for household members
create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  dietary_preferences jsonb default '{}',
  allergies text[],
  shopping_preferences jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (household_id, user_id)
);

-- Create a table for shopping lists
create table shopping_lists (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_template boolean default false
);

-- Create a table for list items
create table list_items (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references shopping_lists(id) on delete cascade,
  name text not null,
  quantity integer default 1,
  unit text,
  category text,
  notes text,
  for_user uuid references profiles(id),
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Create a table for dietary preferences/restrictions
create table dietary_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  preference_type text not null,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table shopping_lists enable row level security;
alter table list_items enable row level security;
alter table dietary_preferences enable row level security;
alter table stores enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can view households they belong to"
  on households for select
  using (
    exists (
      select 1 from household_members
      where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Household members can view lists"
  on shopping_lists for select
  using (
    exists (
      select 1 from household_members
      where household_members.household_id = shopping_lists.household_id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Household members can create lists"
  on shopping_lists for insert
  with check (
    exists (
      select 1 from household_members
      where household_members.household_id = shopping_lists.household_id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Household members can view items"
  on list_items for select
  using (
    exists (
      select 1 from shopping_lists
      join household_members on household_members.household_id = shopping_lists.household_id
      where list_items.list_id = shopping_lists.id
      and household_members.user_id = auth.uid()
    )
  );

-- Enable RLS and policies for stores
DROP POLICY IF EXISTS "stores_select" ON stores;
DROP POLICY IF EXISTS "stores_insert" ON stores;

CREATE POLICY "stores_select" ON stores
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "stores_insert" ON stores
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Index for case-insensitive lookup
CREATE INDEX IF NOT EXISTS stores_name_idx ON stores (lower(name));

-- Create indexes for better performance
create index household_members_user_id_idx on household_members(user_id);
create index shopping_lists_household_id_idx on shopping_lists(household_id);
create index list_items_list_id_idx on list_items(list_id);
create index list_items_for_user_idx on list_items(for_user); 