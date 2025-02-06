const AWS = require("aws-sdk");
require("dotenv").config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function uploadImage(eventId, imageData) {
  const key = `event-images/${eventId}.svg`;

  await s3
    .putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: imageData,
      ContentType: "image/svg+xml",
    })
    .promise();

  return key;
}

module.exports = { uploadImage };
