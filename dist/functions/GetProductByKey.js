const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient");

async function GetProductByKey(request, context) {
  try {
      console.log('Comng Here : GetProductByKey');
    // Read product key from query
    const productKey = request.query.get("key");

    context.log(`Fetching product with key: ${productKey}`);

    // Call Commercetools API
    const response = await apiRoot
      .productProjections()
      .withKey({ key: productKey })
      .get()
      .execute();


     // Call Commercetools API
    // const response = await apiRoot
    //   .productProjections()
    //   .get({
    //     queryArgs: {
    //       // Filter variants to match the specific SKU
    //       where: `masterVariant(sku="${productSku}") or variants(sku="${productSku}")`,
    //       staged: true, // Set to true for unpublished, false for published
    //       priceCurrency: 'USD',
    //       limit: 1
    //     },
    //   })
    //   .execute();


    const product = response.body;

    // Transform payload (clean response)
    const transformed = {
      id: product?.id,
      key: product?.key,
      name: product?.name?.en,
      sku: product?.masterVariant?.sku,
      price: product?.masterVariant?.prices?.[0]?.value,
      image: product?.masterVariant?.images?.[0]?.url,
      createdAt: product?.createdAt,
      lastModifiedAt: product?.lastModifiedAt,
    };

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: transformed,
        raw: product,
      },
    };
  } catch (error) {
    context.error("Error fetching product:", error);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Failed to fetch product from Commercetools",
        error: error?.message || "Internal Server Error",
      },
    };
  }
}

app.http("GetProductByKey", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: GetProductByKey,
});

module.exports = { GetProductByKey };
