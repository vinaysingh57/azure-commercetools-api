const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");


async function getCustomer(request, context) {
  console.log("Coming Here");

  let response; // declare in outer scope so it's visible after try/catch

  try {
    const customerId = "ac947939-539e-411f-8d78-f5ddee868971"; // or from request

    response = await apiRoot
      .customers()
      .withId({ ID: customerId })       // 👈 note: ID, not id
      .get()
      .execute();

    console.log("Customer fetched successfully");
    console.log(response.body);         // safe to use here

    return response.body;               // return customer data

  } catch (error) {
    console.error("Error while fetching customer by ID:", error);

    // Option 1: return null/undefined if you want to swallow the error
    // return null;

    // Option 2 (better for most services): rethrow so caller can handle it
    throw error;
  }
}

app.http("getCustomer", { 
    method: ["GET"],
    authLevel: "anonymous", 
    handler: getCustomer
});
module.exports = { getCustomer };