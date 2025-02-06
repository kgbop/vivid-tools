const s3Service = require("./s3Service");

const SlackNotify = require("slack-notify");
const axios = require("axios");

const slack = SlackNotify(process.env.MY_SLACK_WEBHOOK_URL);

async function processEvents(pool) {
  const events = await pool.query(
    "SELECT * FROM event_mappings WHERE s3_image_path IS NULL AND notification_enabled = true"
  );

  for (const event of events.rows) {
    try {
      // Get TM image
      const tmResponse = await axios.get(
        `https://tm-pr.fly.dev/image/${event.external_event_id}`
      );

      if (tmResponse.data) {
        let imageData = tmResponse.data;

        // Upload to S3
        const s3Path = await s3Service.uploadImage(
          event.external_event_id,
          imageData
        );

        // Update database
        const result = await pool.query(
          `UPDATE event_mappings 
                     SET s3_image_path = $1, 
                         processed_at = CURRENT_TIMESTAMP 
                     WHERE id = $2
                     RETURNING *`,
          [s3Path, event.id]
        );

        // Send Slack notification
        if (result.rows[0]) {
          const message =
            `🚨 *Alert: New Event Layout Processed! <${`https://tm-mapss.s3.us-east-2.amazonaws.com/${result.rows[0].s3_image_path}`}|${
              result.rows[0].external_event_name
            }> *\n\n` +
            `🏟️ *Venue:* ${result.rows[0].venue_name}\n` +
            `📅 *Date:* ${new Date(
              result.rows[0].event_date
            ).toLocaleString()}\n\n` +
            `🪣 *S3 Bucket:* ${process.env.AWS_BUCKET_NAME}\n` +
            `🔗 *Event ID:* ${result.rows[0].external_event_id}\n` +
            `<@U48E0GE3Y> <@U4626BCFN> <@U46H26ALV> <@U077M9S7W1L>`;

          slack
            .send(message)
            .then(() => {
              console.log("Message sent successfully!");
            })
            .catch((err) => {
              console.error("Error sending message:", err);
            });
        }
      }
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
    }
  }
}

module.exports = { processEvents };
