const express = require("express");
const { Pool } = require("pg");
const cron = require("node-cron");
const eventProcessor = require("./services/eventProcessor");
const path = require("path");

require("dotenv").config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
});

app.use(express.json());
app.use(express.static("public"));

// API Routes
app.get("/api/events", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM event_mappings ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/api/events", async (req, res) => {
  const {
    external_event_id,
    external_event_name,
    external_event_url,
    venue_name,
    city,
    state,
    event_date,
    notification_enabled,
  } = req.body;

  const result = await pool.query(
    `INSERT INTO event_mappings 
        (external_event_id, external_event_name, external_event_url, venue_name, 
         city, state, event_date, notification_enabled) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
    [
      external_event_id,
      external_event_name,
      external_event_url,
      venue_name,
      city,
      state,
      event_date,
      notification_enabled,
    ]
  );

  res.json(result.rows[0]);
});

app.patch("/api/events/:id/notification", async (req, res) => {
  const { id } = req.params;
  const { notification_enabled } = req.body;

  const result = await pool.query(
    "UPDATE event_mappings SET notification_enabled = $1 WHERE id = $2 RETURNING *",
    [notification_enabled, id]
  );

  res.json(result.rows[0]);
});

app.post("/api/reset-layouts", async (req, res) => {
  const result = await pool.query(
    "UPDATE event_mappings SET s3_image_path = NULL"
  );
  res.json({ message: "All layout paths have been reset" });
});

// Schedule image processing job
cron.schedule("*/5 * * * *", () => {
  console.log("Running scheduled image processing job...");
  eventProcessor.processEvents(pool);
});

// Route for the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route for the price comparison tool
app.get("/price-comparison", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "price-comparison", "index.html")
  );
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
