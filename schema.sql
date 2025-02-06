CREATE TABLE event_mappings (
    id SERIAL PRIMARY KEY,
    external_event_id VARCHAR(255) NOT NULL,
    external_event_name VARCHAR(255) NOT NULL,
    external_event_url TEXT,
    venue_name VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    event_date TIMESTAMP,
    notification_enabled BOOLEAN DEFAULT false,
    tm_image_url TEXT,
    s3_image_path TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO event_mappings 
(external_event_id, external_event_name, external_event_url, venue_name, city, state, event_date)
VALUES 
('11006177DFF23F30', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-vancouver-british-columbia-07-22-2025/event/11006177DFF23F30', 'Rogers Arena', 'Vancouver', 'BC', '2025-07-22T19:00:00-07:00'),
('110061770F084E80', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-edmonton-alberta-07-24-2025/event/110061770F084E80', 'Rogers Place', 'Edmonton', 'AB', '2025-07-24T19:00:00-06:00'),
('11006177F0774585', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-winnipeg-manitoba-07-26-2025/event/11006177F0774585', 'Canada Life Centre', 'Winnipeg', 'MB', '2025-07-26T19:00:00-05:00'),
('31006173A4D1259B', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-ottawa-ontario-07-29-2025/event/31006173A4D1259B', 'Canadian Tire Centre', 'Ottawa', 'ON', '2025-07-29T19:00:00-04:00'),
('31006174AA453266', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-montreal-quebec-07-30-2025/event/31006174AA453266', 'Centre Bell', 'Montreal', 'QC', '2025-07-30T19:00:00-04:00'),
('3100617588CF1C74', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-quebec-quebec-08-01-2025/event/3100617588CF1C74', 'Centre Videotron', 'Quebec', 'QC', '2025-08-01T19:00:00-04:00'),
('100061759FC83D09', 'KATY PERRY - THE LIFETIMES TOUR', 'https://www.ticketmaster.ca/katy-perry-the-lifetimes-tour-toronto-ontario-08-05-2025/event/100061759FC83D09', 'Scotiabank Arena', 'Toronto', 'ON', '2025-08-05T19:00:00-04:00');