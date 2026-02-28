const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");

app.http("graphqlCreateCustomers", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log("Initiated");

    try {
     /* console.log("Fetch Customer data");
      const graphQlQuery = {
        query: `
          query CustomerInfo {
            customers(limit: 10) {
              total
              results {
                firstName
                lastName
                salutation
              }
            }
          }
        `
      };*/

       console.log("Create Customer");
const graphQlQuery = {
      query: `
        mutation MyMutation {
    customerSignUp(
      draft: {email: "demoCustomer44@yuopmail.com", firstName: "Demo", lastName: "Customer", password: "Demo@Customer@123"}
    ) {
      customer {
        id
        email
        firstName
        lastName
      }
    }
  }`
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
        return;
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
      return {
        status: 500,
        jsonBody: {
          message: "Failed",
          error: error.message
        }
      };
    }
  },
});