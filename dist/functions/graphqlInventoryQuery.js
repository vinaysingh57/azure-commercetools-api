const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");

app.http("graphqlInventoryQuery", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log("Initiated");

    try {
      const body = await request.json();
      const sku = body.sku;

      // let sku = request.query.get('sku');

      /// Add Validatio if SKU notPresent

      context.log(`To Fetch inventory of SKU : ${sku}`);

      const graphQlQuery = {
        query: `query {
                        inventoryEntries(where: "sku=\\"${sku}\\"") {
                            total
                            results {
                                availableQuantity
                                sku
                                supplyChannel {
                                    name
                                }
                            }
                        }
                    }
                `,
      };

      console.log(graphQlQuery);

      // 2. Execute the Create request
      const response = await apiRoot
        .graphql()
        .post({
          body: graphQlQuery,
        })
        .execute();

      console.log(JSON.stringify(response));

      const inventoryData = response.body?.data?.inventoryEntries;
      // console.log(inventoryData);
      console.log(inventoryData?.total);
      return {
        status: 200,
        jsonBody:{
        sku: sku,
        availableQuantity: inventoryData?.results || 0,
        }
      };
    } catch (error) {
      status: 500;
      Message: "Failed";
      error: error.massage;
    }
  },
});