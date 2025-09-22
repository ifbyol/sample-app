-- BookingManagement Database Initialization Script
-- Creates tables and populates with fake data

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    floor INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    beds INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    number_of_guests INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Accepted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_guest_count CHECK (number_of_guests > 0),
    CONSTRAINT check_dates CHECK (end_date > start_date),
    CONSTRAINT check_status CHECK (status IN ('Accepted', 'Cancelled', 'Refused'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- Insert fake data for Users
INSERT INTO users (email, username, date_of_birth, name, surname) VALUES
    ('john.doe@email.com', 'johndoe', '1990-05-15', 'John', 'Doe'),
    ('jane.smith@email.com', 'janesmith', '1985-08-22', 'Jane', 'Smith'),
    ('mike.johnson@email.com', 'mikejohnson', '1992-12-03', 'Mike', 'Johnson'),
    ('sarah.wilson@email.com', 'sarahwilson', '1988-03-18', 'Sarah', 'Wilson'),
    ('david.brown@email.com', 'davidbrown', '1995-07-09', 'David', 'Brown'),
    ('emily.davis@email.com', 'emilydavis', '1987-11-27', 'Emily', 'Davis'),
    ('chris.miller@email.com', 'chrismiller', '1993-01-14', 'Chris', 'Miller'),
    ('lisa.garcia@email.com', 'lisagarcia', '1989-06-30', 'Lisa', 'Garcia'),
    ('tom.anderson@email.com', 'tomanderson', '1991-04-08', 'Tom', 'Anderson'),
    ('anna.taylor@email.com', 'annataylor', '1994-09-12', 'Anna', 'Taylor'),
    ('robert.white@email.com', 'robertwhite', '1986-02-25', 'Robert', 'White'),
    ('maria.lopez@email.com', 'marialopez', '1990-10-07', 'Maria', 'Lopez'),
    ('james.harris@email.com', 'jamesharris', '1992-08-16', 'James', 'Harris'),
    ('jessica.clark@email.com', 'jessicaclark', '1987-12-04', 'Jessica', 'Clark'),
    ('kevin.lewis@email.com', 'kevinlewis', '1995-05-21', 'Kevin', 'Lewis')
ON CONFLICT (email) DO NOTHING;

-- Insert fake data for Rooms
INSERT INTO rooms (name, floor, bathrooms, beds, capacity) VALUES
    ('Ocean View Suite', 3, 2, 2, 4),
    ('Mountain Cabin', 1, 1, 1, 2),
    ('City Penthouse', 10, 3, 3, 6),
    ('Garden Villa', 1, 2, 2, 4),
    ('Sky Loft', 8, 1, 1, 2),
    ('Luxury Suite', 5, 2, 2, 4),
    ('Cozy Studio', 2, 1, 1, 2),
    ('Family Room', 4, 2, 3, 6),
    ('Executive Suite', 7, 2, 2, 4),
    ('Budget Room', 1, 1, 1, 2),
    ('Deluxe Double', 6, 1, 2, 3),
    ('Presidential Suite', 12, 4, 4, 8),
    ('Standard Twin', 3, 1, 2, 2),
    ('Junior Suite', 9, 1, 1, 3),
    ('Superior Room', 4, 1, 2, 4),
    ('Economy Single', 2, 1, 1, 1),
    ('Honeymoon Suite', 11, 2, 1, 2),
    ('Business Room', 8, 1, 1, 2),
    ('Connecting Rooms', 5, 2, 4, 8),
    ('Accessible Room', 1, 1, 2, 3)
ON CONFLICT DO NOTHING;

-- Insert fake data for Bookings
INSERT INTO bookings (user_id, room_id, number_of_guests, start_date, end_date, payment_id, status) VALUES
    (1, 1, 2, '2024-01-15', '2024-01-18', 'pay_abc123', 'Accepted'),
    (2, 3, 4, '2024-02-01', '2024-02-05', 'pay_def456', 'Accepted'),
    (3, 2, 1, '2024-01-20', '2024-01-22', 'pay_ghi789', 'Cancelled'),
    (4, 8, 5, '2024-03-10', '2024-03-15', 'pay_jkl012', 'Accepted'),
    (5, 5, 2, '2024-02-14', '2024-02-16', 'pay_mno345', 'Refused'),
    (6, 12, 6, '2024-04-01', '2024-04-07', 'pay_pqr678', 'Accepted'),
    (7, 7, 1, '2024-01-25', '2024-01-27', 'pay_stu901', 'Accepted'),
    (8, 4, 3, '2024-02-20', '2024-02-25', 'pay_vwx234', 'Cancelled'),
    (9, 10, 2, '2024-03-05', '2024-03-08', 'pay_yza567', 'Accepted'),
    (10, 15, 4, '2024-05-01', '2024-05-05', 'pay_bcd890', 'Accepted'),
    (11, 6, 3, '2024-02-10', '2024-02-13', 'pay_efg123', 'Accepted'),
    (12, 9, 2, '2024-03-20', '2024-03-23', 'pay_hij456', 'Refused'),
    (13, 11, 2, '2024-04-15', '2024-04-18', 'pay_klm789', 'Accepted'),
    (14, 14, 1, '2024-01-30', '2024-02-02', 'pay_nop012', 'Cancelled'),
    (15, 17, 2, '2024-06-01', '2024-06-03', 'pay_qrs345', 'Accepted'),
    (1, 13, 2, '2024-07-10', '2024-07-12', 'pay_tuv678', 'Accepted'),
    (2, 16, 1, '2024-03-01', '2024-03-03', 'pay_wxy901', 'Accepted'),
    (3, 18, 2, '2024-05-15', '2024-05-17', 'pay_zab234', 'Cancelled'),
    (4, 19, 7, '2024-08-01', '2024-08-10', 'pay_cde567', 'Accepted'),
    (5, 20, 2, '2024-04-20', '2024-04-22', 'pay_fgh890', 'Refused'),
    (6, 1, 3, '2024-09-01', '2024-09-05', 'pay_ijk123', 'Accepted'),
    (7, 3, 4, '2024-06-15', '2024-06-20', 'pay_lmn456', 'Accepted'),
    (8, 2, 1, '2024-07-25', '2024-07-28', 'pay_opq789', 'Accepted'),
    (9, 8, 6, '2024-10-01', '2024-10-07', 'pay_rst012', 'Cancelled'),
    (10, 5, 2, '2024-11-10', '2024-11-12', 'pay_uvw345', 'Accepted')
ON CONFLICT DO NOTHING;

-- Display summary
SELECT 'Database initialization completed successfully!' as message;
SELECT 'Users created: ' || COUNT(*) as users_count FROM users;
SELECT 'Rooms created: ' || COUNT(*) as rooms_count FROM rooms;
SELECT 'Bookings created: ' || COUNT(*) as bookings_count FROM bookings;