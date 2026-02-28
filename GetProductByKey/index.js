const { apiRoot } = require("../src/services/commercetoolsClient.js");
 
module.exports = async function (context, request) {
  try {
    const productKey = request.query.key;
 
    context.log(`Fetching product with key: ${productKey}`);
 
    const response = await apiRoot
      .productProjections()
      .withKey({ key: productKey })
      .get()
      .execute();
 
    const product = response.body;
 
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
 
    context.res = {
      status: 200,
      body: {
        success: true,
        data: transformed,
        raw: product,
      },
    };
  } catch (error) {
    context.log.error("Error fetching product:", error);
    context.res = {
      status: 500,
      body: {
        success: false,
        message: "Failed to fetch product from Commercetools",
        error: error?.message || "Internal Server Error",
      },
    };
  }
};