-- Extensions
create extension if not exists pgcrypto;

-- Enums mirror the TS unions in src/types/index.ts and src/types/auth.ts.
create type user_role as enum ('admin', 'staff');
create type staff_status as enum ('pending', 'approved', 'rejected');
create type payment_method as enum ('cash', 'ewallet');
create type payment_status as enum ('pending', 'paid', 'verified');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
create type customer_type as enum ('regular', 'pwd', 'senior');
create type discount_status as enum ('none', 'pending', 'verified');
create type inventory_movement_type as enum ('added', 'removed', 'adjusted', 'sale', 'damaged', 'expired');
