const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient");

app.http("CreateProduct", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        try {
            const body = await request.json();

            // 1. Validate mandatory fields for the commercetools ProductDraft
            if (!body.name || !body.slug || !body.productType) {
                return {
                    status: 400,
                    jsonBody: { message: "Missing required fields: name, slug, or productType" }
                };
            }





            context.log(`Creating product: ${body.name.en}`);

            // 2. Execute the Create request
            const response = await apiRoot
                .products()
                .post({
                    body: {
                        name: body.name,          // e.g., { en: "My New Product" }
                        slug: body.slug,          // e.g., { en: "my-new-product" }
                        productType: body.productType, // e.g., { typeId: "product-type", id: "UUID" }
                        masterVariant: body.masterVariant || { sku: `SKU-${Date.now()}` },
                        publish: body.publish || false // Set to true to make it live immediately
                    }
                })
                .execute();

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    productId: response.body.id,
                    product: response.body
                }
            };

        } catch (error) {
            context.error("Failed to create product:", error.message);
            return {
                status: error.statusCode || 500,
                jsonBody: {
                    success: false,
                    error: error.message,
                    details: error.body?.errors || []
                }
            };
        }
    }
});