create table `product` (
  `id` bigint auto_increment primary key,
  `category` enum ('SNACK', 'BEVERAGE', 'SIDE_DISH', 'DESSERT') not null,
  `created_at` datetime(6) not null,
  `description` varchar(256) not null,
  `name` varchar(80) not null,
  `price` decimal(6, 2) not null,
  `updated_at` datetime(6) not null
);

CREATE TABLE `order` (
  `id` VARCHAR(255) PRIMARY KEY,
  `products` VARCHAR(255),
  `status` VARCHAR(255),
  `user_id` VARCHAR(255)
);

CREATE TABLE `order_history` (
  `id` VARCHAR(255) PRIMARY KEY,
  `order_id` VARCHAR(255),
  `old_status` VARCHAR(255),
  `new_status` VARCHAR(255),
  `msg` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `users` (
  `id` VARCHAR(255) PRIMARY KEY,
  `name` VARCHAR(255),
  `cpf` VARCHAR(11) UNIQUE,
  `email` VARCHAR(255) UNIQUE,
  `password` VARCHAR(255),
  `phone` VARCHAR(255),
  `address` VARCHAR(255),
  `is_admin` BOOLEAN
);
