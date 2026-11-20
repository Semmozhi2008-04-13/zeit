create database zeit;
use zeit;


CREATE TABLE user(
	user_id int auto_increment PRIMARY KEY,
    name varchar(50) NOT NULL,
    phone varchar(20) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL
);
describe user;

CREATE TABLE address(
address_id int auto_increment PRIMARY KEY,
user_id int NOT NULL,
address_line varchar(255) NOT NULL,
city varchar(100) NOT NULL,
state varchar(100) NOT NULL,
pincode varchar(10) NOT NULL,


foreign key(user_id) references user(user_id)
);

describe address;

CREATE TABLE product (
product_id int auto_increment primary key,
user_id int NOT NULL,
description varchar(255),
weight varchar(255) NOT NULL,
price int ,
stock_quantity varchar(255),

foreign key(user_id) references user(user_id)
);

describe product;

CREATE TABLE cart(
cart_id INT auto_increment primary key,
user_id int not null,
product_id int not null,
quantity int,
foreign key(user_id) references user(user_id),
foreign key(product_id) references product(product_id),
unique(user_id, product_id),
check(quantity > 0)
);
describe cart;
CREATE TABLE password_reset(
reset_id int auto_increment primary key,
user_id int not null, 
otp_hash varchar(255) not null,
expire_at datetime not null,
otp_used boolean not null default false,

foreign key(user_id) references user(user_id),
index(user_id)
);
describe password_reset;

CREATE TABLE contact_msg(
msg_id int not null primary key auto_increment,
name varchar(255) not null,
email varchar(255) not null unique,
phone varchar(15) not null,
msg TEXT not null
);

CREATE TABLE bill(
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    address_id INT NOT NULL,
    bill_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bill_status VARCHAR(20) NOT NULL DEFAULT 'GENERATED',

    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (address_id) REFERENCES address(address_id)
);


CREATE TABLE bill_item(
	bill_item_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    item_subtotal DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (bill_id) REFERENCES bill(bill_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (item_subtotal >= 0)
);


SELECT
    u.name AS customer_name,
    u.phone,
    u.email,
    a.address_line,
    a.city,
    a.state,
    a.pincode,
    p.product_id,
    p.description AS product_name,
    c.quantity,
    p.price AS unit_price,
    (c.quantity * p.price) AS item_subtotal
FROM user u
JOIN cart c
    ON u.user_id = c.user_id
JOIN product p
    ON c.product_id = p.product_id
JOIN address a
    ON u.user_id = a.user_id
WHERE u.user_id = 1;

