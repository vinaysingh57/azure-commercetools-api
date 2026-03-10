const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient");

app.http("createOrder", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        try {
            const body = await request.json();

            console.log("Body Parameter");
            console.log(body);
            //console.log(body.cart.id);

            // First Validate required parameter before create cart

            
            if (!body.currency || !body.country || !body.lineItems || !body.shippingAddress) {
                return {
                    status: 400,
                    jsonBody: { message: "Missing required fields to create Cart: currency, country, lineItems, shippingAddress" }
                };
            }

            let customerId = '';
             if(body.customerId){
                customerId = body.customerId;
             }

            // call function to create cart
            console.log("Calling function to create Cart");
           const CartId = await createCart(
                body.currency,
                body.country,
                body.lineItems,
                body.shippingAddress,
                customerId
            );

            console.log("Cart Id : "+ CartId);

            // 1. Validate mandatory fields for the commercetools Order Create
            if (!CartId) {
                return {
                    status: 400,
                    jsonBody: { message: "Missing required fields: Cart id" }
                };
            }
            console.log("Param Pass");
            const cartDetails = { 
                id : CartId,
                typeId : 'cart'
            };
            console.log("cartDetails"+ cartDetails);

            context.log(`Creating order with cart Id: ${CartId}`);

            // 2. Execute the Create request
            const response = await apiRoot
                .orders()
                .post({
                    body: {
                        cart: cartDetails,  // pass cart id details
                        version: body.version  // Set version
                    }
                })
                .execute();

            console.log("Order Created Successfully");
            console.log(response.body.id);
            console.log(response.body);

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    orderId: response.body.id,
                    order: response.body
                }
            };

        } catch (error) {
            context.error("Failed to create Order:", error.message);
            console.log("Error During creating Order :   "+error.message);

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

async function createCart(currency, country, lineItems, shippingAddress, customerId) {
    console.log("Create cart Function");

    try {
        // 2. Execute the Create request
        const response = await apiRoot
            .carts()
            .post({
                body: {
                    currency: currency,
                    country: country,
                    lineItems:lineItems,
                    shippingAddress:shippingAddress,
                    customerId
                }
            })
            .execute();

        console.log("Cart Created Successfully");
        console.log(response.body.id);
        return response.body.id;
    }
    catch (error) {
            context.error("Failed to create Cart:", error.message);
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