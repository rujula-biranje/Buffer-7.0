-- Point existing seeded items to local assets in frontend/public/images,
-- and add two new items (Vada Pav, Pizza). Vite serves /public at the
-- frontend origin, so /images/<file>.jpg resolves to http://<frontend>/images/<file>.jpg.

update items set image_url = '/images/samosa.jpg'       where name = 'Samosa';
update items set image_url = '/images/cold-coffee.jpg'  where name = 'Cold Coffee';
update items set image_url = '/images/masala-dosa.jpg'  where name = 'Masala Dosa';
update items set image_url = '/images/veg-sandwich.jpg' where name = 'Veg Sandwich';

-- Idempotent inserts: no UNIQUE constraint on items.name, so we guard with NOT EXISTS.
insert into items (name, description, price, quantity, prep_time_minutes, image_url)
select 'Vada Pav', 'Spicy potato vada in a soft pav with chutneys', 30.00, 25, 4, '/images/vada-pav.jpg'
where not exists (select 1 from items where name = 'Vada Pav');

insert into items (name, description, price, quantity, prep_time_minutes, image_url)
select 'Pizza', 'Cheese pizza with tangy tomato sauce', 120.00, 12, 12, '/images/pizza.jpg'
where not exists (select 1 from items where name = 'Pizza');
