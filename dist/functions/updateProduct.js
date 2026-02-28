const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient");

/**
 * Time Trigger Function
 * Runs on schedule and updates a product in Commercetools
 */
async function UpdateProductTimer(timer, context) {
  const productKey = process.env.CT_DEFAULT_PRODUCT_KEY || "73207";

  context.log("⏰ Timer trigger executed - Update Product Job");
  context.log(`Updating product with key: ${productKey}`);

  try {
    // 1️⃣ Fetch current product (to get ID + VERSION)
    const productResponse = await apiRoot
      .products()
      .withKey({ key: productKey })
      .get()
      .execute();

    const product = productResponse.body;
    const productId = product.id;
    const currentVersion = product.version;

    context.log(`Product fetched. ID: ${productId}, Version: ${currentVersion}`);

    // 2️⃣ Prepare update actions (Commercetools requires versioned updates)
    const updateActions = [
      {
        action: "changeName",
        name: {
          en: `Updated Product - ${new Date().toISOString()}`
        }
      }
      // You can add more actions here:
      // { action: "setDescription", description: { en: "Updated via Azure Timer" } }
      // { action: "publish" }
    ];

    // 3️⃣ Update product
    const updateResponse = await apiRoot
      .products()
      .withId({ ID: productId })
      .post({
        body: {
          version: currentVersion,
          actions: updateActions
        }
      })
      .execute();

    const updatedProduct = updateResponse.body;

    // 4️⃣ Log result (Timer functions don’t return HTTP response)
    context.log("✅ Product updated successfully");
    context.log(
      "Updated Product:",
      JSON.stringify(
        {
          id: updatedProduct.id,
          key: updatedProduct.key,
          version: updatedProduct.version,
          name: updatedProduct.masterData?.current?.name?.en,
          lastModifiedAt: updatedProduct.lastModifiedAt
        },
        null,
        2
      )
    );
  } catch (error) {
    context.error("❌ Error updating product in Commercetools:", error?.message || error);

    // Helpful debug for Commercetools version conflict
    if (error?.body) {
      context.error("Commercetools Error Body:", JSON.stringify(error.body, null, 2));
    }
  }
}

// CRON: Every 5 minutes (can change as needed)
app.timer("UpdateProductTimer", {
    schedule: "20 * * * * *", // Every 5 minutes
         // // ┬ ┬ ┬ ┬ ┬ ┬
            // │ │ │ │ │ └─ Day of week
            // │ │ │ │ └── Month
            // │ │ │ └──── Day
            // │ │ └────── Hour
            // │ └──────── Minute
            // └────────── Second
  handler: UpdateProductTimer,
});

module.exports = { UpdateProductTimer };
