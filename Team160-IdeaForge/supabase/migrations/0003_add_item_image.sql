-- Add image_url column to items and seed placeholder images for existing rows.

alter table items add column if not exists image_url text;

update items set image_url = case name
  when 'Veg Sandwich' then 'https://loremflickr.com/600/400/sandwich'
  when 'Masala Dosa'  then 'https://loremflickr.com/600/400/dosa,indianfood'
  when 'Samosa'       then 'https://loremflickr.com/600/400/samosa'
  when 'Cold Coffee'  then 'https://loremflickr.com/600/400/icedcoffee'
  when 'Paneer Roll'  then 'https://loremflickr.com/600/400/paneer,wrap'
  else image_url
end
where image_url is null;
