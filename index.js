import SlackNotify from "slack-notify";

const MY_SLACK_WEBHOOK_URL =
  "https://hooks.slack.com/services/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";
const slack = SlackNotify(MY_SLACK_WEBHOOK_URL);

// Sending a simple text message
slack
  .send("Hello, world!")
  .then(() => {
    console.log("Message sent successfully!");
  })
  .catch((err) => {
    console.error("Error sending message:", err);
  });
