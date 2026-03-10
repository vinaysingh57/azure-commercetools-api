const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");

// Helper: Get channel by key
async function getChannelByKey(channelKey) {
  const response = await apiRoot
    .channels()
    .withKey({ key: channelKey })
    .get()
    .execute();

  return response.body;
}

// Helper: Get inventory entry by sku + channel
async function getInventoryEntryBySkuAndChannel(sku, channelId) {
  const whereClause = `sku="${sku}" and supplyChannel(id="${channelId}")`;

  const response = await apiRoot
    .inventory()
    .get({
      queryArgs: {
        where: whereClause,
        limit: 1,
      },
    })
    .execute();

  return response.body.results[0] || null;
}

// Helper: Create new inventory entry
async function createInventoryEntry(sku, quantityOnStock, channelId) {
  const response = await apiRoot
    .inventory()
    .post({
      body: {
        sku,
        quantityOnStock,
        supplyChannel: {
          typeId: "channel",
          id: channelId,
        },
      },
    })
    .execute();

  return response.body;
}

// Helper: Update existing inventory entry
async function updateInventoryQuantity(inventoryEntry, newQuantity) {
  const response = await apiRoot
    .inventory()
    .withId({ ID: inventoryEntry.id })
    .post({
      body: {
        version: inventoryEntry.version,
        actions: [
          {
            action: "changeQuantity",
            quantity: newQuantity,
          },
        ],
      },
    })
    .execute();

  return response.body;
}

// Upsert helper
async function upsertInventoryForSkuAndChannel(sku, quantityOnStock, channelKey = "INV-STK") {
  // 1. Get channel
  const channel = await getChannelByKey(channelKey);

  // 2. Get existing entry
  const existingEntry = await getInventoryEntryBySkuAndChannel(sku, channel.id);

  if (existingEntry) {
    const updated = await updateInventoryQuantity(existingEntry, quantityOnStock);
    return {
      action: "updated",
      entry: updated,
    };
  } else {
    const created = await createInventoryEntry(sku, quantityOnStock, channel.id);
    return {
      action: "created",
      entry: created,
    };
  }
}

// Azure Function
app.http("updateInventory", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log("Inventory update initiated");

    try {
      const body = await request.json();
      const sku = body?.sku;
      const quantityOnStock = body?.quantityOnStock;
      const channelKey = body?.channelKey || "INV-STK"; // optional override

      if (!sku || typeof quantityOnStock !== "number") {
        return {
          status: 400,
          jsonBody: {
            message:
              'sku (string) and quantityOnStock (number) are required. Example: { "sku": "TEST-SKU-123", "quantityOnStock": 10 }',
          },
        };
      }

      const result = await upsertInventoryForSkuAndChannel(
        sku,
        quantityOnStock,
        channelKey
      );

      return {
        status: 200,
        jsonBody: {
          message: `Inventory ${result.action} successfully`,
          inventoryEntry: result.entry,
        },
      };
    } catch (error) {
      context.log("Error in updateInventory:", error);
      return {
        status: 500,
        jsonBody: {
          message: "Failed to update inventory",
          error: error.message,
        },
      };
    }
  },
});