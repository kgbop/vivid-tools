document.addEventListener("DOMContentLoaded", () => {
  const compareButton = document.getElementById("compareButton");
  const productionIdInput = document.getElementById("productionId");
  const rdmDataInput = document.getElementById("rdmData");
  const vividDataInput = document.getElementById("vividData");
  const quantityInput = document.getElementById("quantity");
  const loadingElement = document.getElementById("loading");
  const resultsElement = document.getElementById("comparisonResults");

  // Add export button
  const exportButton = document.createElement("button");
  exportButton.id = "exportButton";
  exportButton.textContent = "Export to CSV";
  exportButton.style.display = "none";
  resultsElement.parentNode.insertBefore(exportButton, resultsElement);

  // Add event info container with styled wrapper
  const eventInfoContainer = document.createElement("div");
  eventInfoContainer.id = "eventInfoContainer";
  eventInfoContainer.className = "event-info-wrapper";
  eventInfoContainer.style.display = "none";
  resultsElement.parentNode.insertBefore(eventInfoContainer, resultsElement);

  // Add export loading element
  const exportLoadingElement = document.createElement("div");
  exportLoadingElement.className = "loading";
  exportLoadingElement.id = "exportLoading";
  exportLoadingElement.style.display = "none";
  exportLoadingElement.innerHTML = `
    <div class="spinner"></div>
    <p>Generating CSV file...</p>
  `;
  exportButton.parentNode.insertBefore(
    exportLoadingElement,
    exportButton.nextSibling
  );

  compareButton.addEventListener("click", async () => {
    const productionId = productionIdInput.value.trim();
    let rdmData;

    try {
      rdmData = JSON.parse(rdmDataInput.value);
    } catch (error) {
      alert("Please enter valid JSON data for RDM inventory");
      return;
    }

    if (!productionId) {
      alert("Please enter a Production ID");
      return;
    }

    // Show loading spinner
    loadingElement.style.display = "block";
    resultsElement.innerHTML = "";
    eventInfoContainer.style.display = "none";

    try {
      const vividListings = await fetchVividSeatsListings(productionId);
      // Display event info first
      displayEventInfo(window.vividGlobalData[0]);
      const comparisons = comparePricing(productionId, rdmData, vividListings);
      displayResults(comparisons);
    } catch (error) {
      alert("Error comparing prices: " + error.message);
    } finally {
      loadingElement.style.display = "none";
    }
  });

  async function fetchVividSeatsListings(productionId) {
    const response = await fetch(
      `https://www.vividseats.com/hermes/api/v1/listings?productionId=${productionId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch VividSeats listings");
    }
    const data = await response.json();
    // Store the global data in window for later use
    window.vividGlobalData = data.global;
    return data.tickets;
  }

  function comparePricing(productionId, rdmInventory, vividListings) {
    const vividMap = new Map(
      vividListings.map((listing) => [listing.i, listing])
    );

    return rdmInventory
      .map((rdmListing) => {
        const vividListing = vividMap.get(rdmListing.i);

        if (vividListing) {
          const priceDiff = rdmListing.p - vividListing.p;
          const percentDiff = ((priceDiff / vividListing.p) * 100).toFixed(2);

          return {
            productionId: productionId,
            identifier: rdmListing.i,
            section: rdmListing.s,
            row: rdmListing.r,
            rdmPrice: rdmListing.p,
            vividPrice: vividListing.p,
            priceDifference: priceDiff,
            percentageDifference: `${percentDiff}%`,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function displayEventInfo(eventInfo) {
    if (!eventInfo) return;

    eventInfoContainer.style.display = "block";
    eventInfoContainer.innerHTML = `
        <div class="event-info-header">
            <h2>${eventInfo.productionName || "Event Name Not Available"}</h2>
        </div>
        <div class="event-info-content">
            <div class="event-basic-info">
                <div class="info-group">
                    <i class="fas fa-venue-marker"></i>
                    <div>
                        <h4>Venue</h4>
                        <p>${eventInfo.mapTitle || "Venue Not Available"}</p>
                        <p class="address">${eventInfo.venueAddress1 || ""}, ${
      eventInfo.venueState || ""
    }, ${eventInfo.venueCountry || ""}</p>
                    </div>
                </div>
                <div class="info-group">
                    <i class="fas fa-ticket"></i>
                    <div>
                        <h4>Event Type</h4>
                        <p>${
                          eventInfo.productionCategory || "Not Available"
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="event-stats">
                <div class="stats-grid">
                    <div class="stat-box">
                        <h4>Total Listings</h4>
                        <p class="stat-value">${
                          eventInfo.listingCount || "N/A"
                        }</p>
                    </div>
                    <div class="stat-box">
                        <h4>Total Tickets</h4>
                        <p class="stat-value">${
                          eventInfo.ticketCount || "N/A"
                        }</p>
                    </div>
                    <div class="stat-box">
                        <h4>Venue Capacity</h4>
                        <p class="stat-value">${
                          eventInfo.venueCapacity || "N/A"
                        }</p>
                    </div>
                </div>
                
                <div class="price-grid">
                    <div class="price-box">
                        <h4>Lowest Price</h4>
                        <p class="price-value">$${eventInfo.lp || "N/A"}</p>
                    </div>
                    <div class="price-box">
                        <h4>Average Price</h4>
                        <p class="price-value">$${eventInfo.atp || "N/A"}</p>
                    </div>
                    <div class="price-box">
                        <h4>Median Price</h4>
                        <p class="price-value">$${eventInfo.mp || "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  function displayResults(comparisons) {
    resultsElement.innerHTML = "";

    // Create containers for both RDM and Vivid results
    const rdmContainer = document.createElement("div");
    rdmContainer.className = "results-container";
    rdmContainer.innerHTML = "<h2>RDM Results</h2>";

    const vividContainer = document.createElement("div");
    vividContainer.className = "results-container";
    vividContainer.innerHTML = "<h2>Vivid Seats Inventory</h2>";

    // Show export button if there are results
    exportButton.style.display = comparisons.length > 0 ? "block" : "none";

    // Display RDM comparisons
    comparisons.forEach((comparison) => {
      const card = document.createElement("div");
      card.className = "comparison-card";

      const isPriceHigher = comparison.priceDifference > 0;
      const differenceClass = isPriceHigher ? "positive" : "negative";

      card.innerHTML = `
        <h3>${comparison.section} - Row ${comparison.row}</h3>
        <div class="detail">
            <span class="label">Identifier:</span>
            <span class="value">${comparison.identifier}</span>
        </div>
        <div class="detail">
            <span class="label">RDM Price:</span>
            <span class="value">$${comparison.rdmPrice}</span>
        </div>
        <div class="detail">
            <span class="label">VividSeats Price:</span>
            <span class="value">$${comparison.vividPrice}</span>
        </div>
        <div class="detail">
            <span class="label">Difference:</span>
            <span class="price-difference ${differenceClass}">
                ${comparison.priceDifference > 0 ? "+" : ""}$${
        comparison.priceDifference
      } (${comparison.percentageDifference})
            </span>
        </div>
      `;

      rdmContainer.appendChild(card);
    });

    // Display Vivid Seats inventory
    try {
      const vividData = JSON.parse(vividDataInput.value || "[]");
      vividData.forEach((listing) => {
        const card = document.createElement("div");
        card.className = "comparison-card vivid-card";

        const isMatched = comparisons.some(
          (comp) => comp.identifier === listing.i
        );
        if (isMatched) {
          card.classList.add("matched");
        }

        card.innerHTML = `
          <h3>${listing.s} - Row ${listing.r}</h3>
          <div class="detail">
              <span class="label">Identifier:</span>
              <span class="value">${listing.i}</span>
          </div>
          <div class="detail">
              <span class="label">Price:</span>
              <span class="value">$${listing.p}</span>
          </div>
          <div class="detail">
              <span class="label">Status:</span>
              <span class="value ${
                isMatched ? "matched-text" : "unmatched-text"
              }">
                  ${isMatched ? "Matched with RDM" : "Unmatched"}
              </span>
          </div>
        `;

        vividContainer.appendChild(card);
      });
    } catch (error) {
      console.error("Error parsing Vivid Seats data:", error);
      vividContainer.innerHTML +=
        "<p class='error'>Error parsing Vivid Seats data</p>";
    }

    // Add both containers to results
    resultsElement.appendChild(rdmContainer);
    resultsElement.appendChild(vividContainer);
  }

  // Update export functionality
  exportButton.addEventListener("click", async () => {
    // Show loading state
    exportButton.disabled = true;
    exportButton.style.display = "none";
    exportLoadingElement.style.display = "block";

    try {
      const productionId = productionIdInput.value.trim();
      const quantity = quantityInput.value.trim() || "2"; // Default to 2 if empty
      let vividInventory = [];

      // Get current date for filename
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      let productionName = "Unknown";
      if (window.vividGlobalData && window.vividGlobalData[0]?.productionName) {
        productionName = window.vividGlobalData[0].productionName
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 30);
      } else {
        try {
          const vividData = JSON.parse(vividDataInput.value || "[]");
          if (vividData.length > 0 && vividData[0].e) {
            productionName = vividData[0].e
              .replace(/[^a-zA-Z0-9]/g, "")
              .substring(0, 30);
          }
        } catch (error) {
          console.error("Error parsing production name:", error);
        }
      }

      // Create filename
      const filename = `2025${month}${day}_${productionName}_${productionId}_FilteringAnalysis.csv`;

      // Parse Vivid Seats inventory data
      try {
        vividInventory = JSON.parse(vividDataInput.value || "[]");
      } catch (error) {
        console.error("Error parsing Vivid Seats inventory data:", error);
        vividInventory = [];
      }

      // Update the CSV export logic to handle both RDM and Vivid containers
      const comparisons = Array.from(
        document.querySelectorAll(".results-container .comparison-card")
      ).map((card) => {
        const details = card.querySelectorAll(".detail");
        const identifier = details[0].querySelector(".value").textContent;

        // Check if this is a Vivid card or RDM card
        const isVividCard = card.classList.contains("vivid-card");

        if (isVividCard) {
          const vividPrice = parseFloat(
            details[1].querySelector(".value").textContent.replace("$", "")
          );
          const isMatched = card.classList.contains("matched");

          return {
            productionId,
            identifier,
            site: "VS",
            price: vividPrice.toLocaleString("en-US"),
            isMatched,
            rdmPrice: "",
            percentDiff: "",
          };
        } else {
          // RDM card
          const rdmPrice = parseFloat(
            details[1].querySelector(".value").textContent.replace("$", "")
          );
          const vividPrice = parseFloat(
            details[2].querySelector(".value").textContent.replace("$", "")
          );
          const percentDiff = Math.round(
            ((rdmPrice - vividPrice) / vividPrice) * 100
          );

          return {
            productionId,
            identifier,
            site: "RDM",
            price: rdmPrice.toLocaleString("en-US"),
            isMatched: true,
            vividPrice: vividPrice.toLocaleString("en-US"),
            percentDiff: `${percentDiff}%`,
          };
        }
      });

      const csvContent = [
        [
          "PID",
          "Quantity",
          "Site",
          "Listing ID",
          "Price",
          "Cross Match?",
          "VS Price",
          "Custom Price Increase",
        ],
        ...comparisons.map((comp) => [
          comp.productionId,
          quantity,
          comp.site,
          comp.identifier,
          `$${comp.price}`,
          comp.isMatched ? "Match" : "Unique",
          comp.vividPrice ? `$${comp.vividPrice}` : "",
          comp.percentDiff || "",
        ]),
      ]
        .map((row) => row.join("\t"))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", filename);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error exporting data: " + error.message);
    } finally {
      // Reset states
      exportButton.disabled = false;
      exportButton.style.display = "block";
      exportLoadingElement.style.display = "none";
      exportButton.textContent = "Export to CSV";
    }
  });

  // Add this style block at the top of your file or in a separate CSS file
  const styles = document.createElement("style");
  styles.textContent = `
    .event-info-wrapper {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin: 20px 0;
        overflow: hidden;
    }

    .event-info-header {
        background: linear-gradient(135deg, #2c3e50, #3498db);
        color: white;
        padding: 20px;
    }

    .event-info-header h2 {
        margin: 0;
        font-size: 24px;
    }

    .event-info-content {
        padding: 20px;
    }

    .event-basic-info {
        display: flex;
        gap: 40px;
        margin-bottom: 30px;
    }

    .info-group {
        display: flex;
        gap: 15px;
    }

    .info-group h4 {
        margin: 0 0 8px 0;
        color: #2c3e50;
        font-size: 16px;
    }

    .info-group p {
        margin: 0;
        color: #666;
    }

    .info-group .address {
        font-size: 0.9em;
        color: #888;
    }

    .event-stats {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
    }

    .stats-grid, .price-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 20px;
    }

    .stat-box, .price-box {
        background: white;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .stat-box h4, .price-box h4 {
        margin: 0 0 10px 0;
        color: #2c3e50;
        font-size: 14px;
    }

    .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #2c3e50;
        margin: 0;
    }

    .price-value {
        font-size: 24px;
        font-weight: bold;
        color: #27ae60;
        margin: 0;
    }

    .price-grid {
        margin-bottom: 0;
    }

    .results-container {
        flex: 1;
        min-width: 300px;
        margin: 10px;
    }

    .vivid-card {
        border-left: 4px solid #3498db;
    }

    .vivid-card.matched {
        border-left: 4px solid #27ae60;
    }

    .matched-text {
        color: #27ae60;
        font-weight: bold;
    }

    .unmatched-text {
        color: #7f8c8d;
    }

    #comparisonResults {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }

    .error {
        color: #e74c3c;
        padding: 10px;
        background: #fde8e8;
        border-radius: 4px;
        margin: 10px 0;
    }
  `;
  document.head.appendChild(styles);
});
