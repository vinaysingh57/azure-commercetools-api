const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");

app.http("createProductCustom", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const productIdUUId = process.env.CT_PRODUCTKEY_UUID;
            console.log("productIdUUId : "+productIdUUId);
            const categoryUUID = process.env.CT_CATEGORY_UUID;
            console.log("categoryUUID : "+categoryUUID);





            // 1. Validate mandatory fields for the commercetools ProductDraft
            if (!body.name || !body.slug) {
                return {
                    status: 400,
                    jsonBody: { message: "Missing required fields: name, slug, or productType" }
                };
            }

            // Check if category coming from third party
            if(!body.categories){
                console.log("Not Category");   
            }
            else{
                console.log(body.categories);
                console.log(body.categories[0].id); 
                
                // body.categories.forEach(cat => {
                // console.log("Category ID:", cat.id);
                // console.log("Type:", cat.typeId);
                // });
                

            }

           context.log(`Creating product: ${body.name.en}`);
         
            const productPayload = {
              productType:{
                typeId:'product-type',
                id : productIdUUId
              },
              name:body.name,
              slug:body.slug,
              description:body.description,
              key:body.productkey,
              categories:[{
                typeId:'category',
                id : categoryUUID
              }],

            }
            context.log(`Creating product: ${productPayload}`);
              console.log(productPayload);


            // 2. Execute the Create request
            const response = await apiRoot
                .products()
                .post({
                    body:productPayload
                })
                .execute();

            return {
                status: 200,
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