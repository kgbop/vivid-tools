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

    try {
      const vividListings = await fetchVividSeatsListings(productionId);
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

  function displayResults(comparisons) {
    resultsElement.innerHTML = "";

    // Show export button if there are results
    exportButton.style.display = comparisons.length > 0 ? "block" : "none";

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

      resultsElement.appendChild(card);
    });
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

      // Parse Vivid Seats inventory data
      try {
        vividInventory = JSON.parse(vividDataInput.value || "[]");
      } catch (error) {
        console.error("Error parsing Vivid Seats inventory data:", error);
        vividInventory = [];
      }

      const comparisons = Array.from(
        document.querySelectorAll(".comparison-card")
      ).map((card) => {
        const details = card.querySelectorAll(".detail");
        const identifier = details[0].querySelector(".value").textContent;
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
          rdmPrice: rdmPrice.toLocaleString("en-US"),
          vividPrice: vividPrice.toLocaleString("en-US"),
          percentDiff,
        };
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
        // Add Vivid Seats inventory data
        ...vividInventory.map((item) => [
          productionId,
          quantity,
          "VS",
          item.i,
          `$${item.p}`,
          comparisons.some((comp) => comp.identifier === item.i)
            ? "Match"
            : "Unique",
          "",
          "",
        ]),
        // Add existing RDM comparisons
        ...comparisons.map((comp) => [
          comp.productionId,
          quantity,
          "RDM",
          comp.identifier,
          `$${comp.rdmPrice}`,
          vividInventory.some((item) => comp.identifier === item.i)
            ? "Match"
            : "Unique",
          `$${comp.vividPrice}`,
          `${comp.percentDiff}%`,
        ]),
      ]
        .map((row) => row.join("\t"))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", "price-comparison.csv");
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
});
