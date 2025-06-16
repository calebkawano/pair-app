-- Add policies for household creation and management
create policy "Users can create households"
  on households for insert
  with check (auth.uid() = created_by);

create policy "Users can update households they created"
  on households for update
  using (auth.uid() = created_by);

create policy "Users can delete households they created"
  on households for delete
  using (auth.uid() = created_by);

-- Add policies for household members
create policy "Users can view household members"
  on household_members for select
  using (
    exists (
      select 1 from households
      where households.id = household_members.household_id
      and (
        households.created_by = auth.uid() or
        exists (
          select 1 from household_members as hm
          where hm.household_id = household_members.household_id
          and hm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can add household members"
  on household_members for insert
  with check (
    exists (
      select 1 from households
      where households.id = household_members.household_id
      and households.created_by = auth.uid()
    ) or
    household_members.user_id = auth.uid()
  );

create policy "Users can update their own household member settings"
  on household_members for update
  using (auth.uid() = user_id);

create policy "Admins can update household member settings"
  on household_members for update
  using (
    exists (
      select 1 from household_members
      where household_members.household_id = household_members.household_id
      and household_members.user_id = auth.uid()
      and household_members.role = 'admin'
    )
  ); 