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
  `is_admin` BOOLEAN
);
