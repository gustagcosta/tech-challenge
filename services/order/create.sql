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
  `msg` VARCHAR(255)
);
