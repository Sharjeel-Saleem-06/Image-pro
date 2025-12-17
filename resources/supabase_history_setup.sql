-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Create specific bucket for processed images
insert into storage.buckets (id, name, public) 
values ('processed_images', 'processed_images', true)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload images
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'processed_images' and auth.uid() = owner );

-- Policy to allow public to view images (or authenticated only, strictly user asked for 'history saved', assuming private but for now public read is easier for prototype)
create policy "Public can view images"
on storage.objects for select
to public
using ( bucket_id = 'processed_images' );

-- Create history table
create table if not exists public.image_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) not null,
    image_url text not null,
    thumbnail_url text, -- Optional smaller preview
    tool_used text, -- e.g., 'remove-bg', 'face-enhance'
    settings jsonb, -- e.g., { "prompt": "..." }
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.image_history enable row level security;

-- Policies for history table
create policy "Users can insert their own history"
on public.image_history for insert
to authenticated
with check ( auth.uid() = user_id );

create policy "Users can view their own history"
on public.image_history for select
to authenticated
using ( auth.uid() = user_id );

-- Optional: Function to auto-cleanup old history if needed
-- (Not implemented to keep it simple)
