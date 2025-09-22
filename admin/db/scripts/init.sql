-- Admin Database Initialization Script
-- Creates tables and populates with fake data

-- Create Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_hiring DATE NOT NULL,
    date_of_birthday DATE NOT NULL,
    position VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_employees_position ON employees(position);
CREATE INDEX idx_employees_hiring_date ON employees(date_of_hiring);
CREATE INDEX idx_complaints_date ON complaints(date);
CREATE INDEX idx_complaints_customer ON complaints(customer);

-- Insert fake data for Employees
INSERT INTO employees (name, last_name, date_of_hiring, date_of_birthday, position) VALUES
    ('John', 'Smith', '2020-03-15', '1985-07-22', 'Front Desk Manager'),
    ('Maria', 'Rodriguez', '2021-01-10', '1990-12-03', 'Housekeeper'),
    ('David', 'Johnson', '2019-08-20', '1982-04-18', 'Concierge'),
    ('Sarah', 'Williams', '2022-02-14', '1988-11-27', 'Chef'),
    ('Michael', 'Brown', '2020-11-05', '1987-09-14', 'Security Guard'),
    ('Emily', 'Davis', '2021-06-30', '1992-01-08', 'Receptionist'),
    ('Robert', 'Miller', '2018-12-01', '1980-05-15', 'Maintenance Supervisor'),
    ('Lisa', 'Wilson', '2022-04-22', '1989-03-20', 'Restaurant Server'),
    ('James', 'Moore', '2019-07-12', '1983-10-12', 'Bellhop'),
    ('Jennifer', 'Taylor', '2021-09-08', '1991-06-25', 'Spa Therapist'),
    ('Christopher', 'Anderson', '2020-01-18', '1986-08-30', 'Valet'),
    ('Amanda', 'Thomas', '2022-11-03', '1993-02-17', 'Event Coordinator'),
    ('Daniel', 'Jackson', '2019-04-25', '1984-12-09', 'Bartender'),
    ('Michelle', 'White', '2021-12-15', '1990-07-04', 'Housekeeping Supervisor'),
    ('Kevin', 'Harris', '2020-06-10', '1988-01-22', 'Kitchen Assistant'),
    ('Rachel', 'Martin', '2022-08-07', '1992-04-11', 'Guest Services'),
    ('Steven', 'Thompson', '2018-10-30', '1981-09-28', 'Night Manager'),
    ('Nicole', 'Garcia', '2021-03-22', '1989-11-16', 'Laundry Attendant'),
    ('Anthony', 'Martinez', '2020-09-14', '1987-06-03', 'Pool Attendant'),
    ('Ashley', 'Robinson', '2022-01-28', '1994-05-19', 'Administrative Assistant')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert fake data for Complaints
INSERT INTO complaints (customer, date, text) VALUES
    ('John Doe', '2024-01-15', 'The air conditioning in room 205 was not working properly during my stay. It was very uncomfortable, especially during the night.'),
    ('Jane Smith', '2024-01-18', 'The breakfast service was extremely slow this morning. I waited over 30 minutes for my order and nearly missed my business meeting.'),
    ('Michael Johnson', '2024-01-22', 'There was excessive noise from the construction work next door starting at 6 AM. This should have been communicated to guests beforehand.'),
    ('Sarah Wilson', '2024-01-25', 'The housekeeping staff did not clean our room properly. There were stains on the bathroom floor and the bed was not made correctly.'),
    ('David Brown', '2024-02-01', 'The Wi-Fi connection in the business center was unreliable. I could not complete my work presentations due to constant disconnections.'),
    ('Emily Davis', '2024-02-05', 'The swimming pool was closed without any prior notice. This was one of the main reasons I chose this hotel for my family vacation.'),
    ('Robert Miller', '2024-02-10', 'The room service took over 2 hours to deliver a simple sandwich. The food was cold when it finally arrived.'),
    ('Lisa Garcia', '2024-02-14', 'The parking garage was full despite having a reservation. I had to park several blocks away and walk in the rain.'),
    ('James Rodriguez', '2024-02-18', 'The hotel restaurant overcharged me for drinks. The bill showed premium liquor prices for standard drinks.'),
    ('Jennifer Martinez', '2024-02-22', 'The shower in room 312 had very low water pressure. It took forever to rinse the shampoo out of my hair.'),
    ('Christopher Lee', '2024-02-28', 'The front desk staff was unhelpful when I requested a room change due to a broken heater. They seemed annoyed by my request.'),
    ('Amanda Thompson', '2024-03-05', 'The gym equipment was out of order and there were no signs indicating this. I planned my morning workout around using the facilities.'),
    ('Daniel Anderson', '2024-03-10', 'The conference room I booked was double-booked. This caused significant embarrassment during my client presentation.'),
    ('Michelle White', '2024-03-15', 'The bed linens in my room smelled musty and appeared to have stains. I had to request new bedding which delayed my rest.'),
    ('Kevin Harris', '2024-03-20', 'The elevator was out of service for my entire 3-day stay. Having to use the stairs to reach the 8th floor was very inconvenient.'),
    ('Rachel Taylor', '2024-03-25', 'The concierge gave me incorrect directions to a local restaurant, causing me to be late for my dinner reservation.'),
    ('Steven Jackson', '2024-03-30', 'The hotel bar ran out of several drink options early in the evening. For the prices charged, this should not happen.'),
    ('Nicole Thomas', '2024-04-02', 'The checkout process took an unreasonably long time due to system issues. I nearly missed my flight because of the delay.'),
    ('Anthony Wilson', '2024-04-08', 'The room key cards kept deactivating throughout my stay. I had to visit the front desk multiple times to get them reprogrammed.'),
    ('Ashley Moore', '2024-04-12', 'The spa appointment I booked was cancelled last minute without any explanation or offer to reschedule at a convenient time.'),
    ('Mark Robinson', '2024-04-18', 'The hotel charged me for items from the minibar that I did not consume. It took several calls to resolve this billing error.'),
    ('Laura Clark', '2024-04-22', 'The room temperature could not be controlled properly. It was either too hot or too cold, never comfortable.'),
    ('Brian Lewis', '2024-04-28', 'The valet service damaged my car while parking it. The scratch on the bumper was definitely not there when I arrived.'),
    ('Christina Walker', '2024-05-03', 'The hotel website advertised a complimentary breakfast, but I was charged for it during checkout. Very misleading.'),
    ('Timothy Hall', '2024-05-10', 'The fire alarm went off at 3 AM due to a malfunction. No compensation was offered for the disrupted sleep and early evacuation.')
ON DUPLICATE KEY UPDATE customer = VALUES(customer);

-- Display summary
SELECT 'Database initialization completed successfully!' as message;
SELECT 'Employees created: ', COUNT(*) as count FROM employees;
SELECT 'Complaints created: ', COUNT(*) as count FROM complaints;