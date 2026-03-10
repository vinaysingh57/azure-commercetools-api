const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");

app.http("graphqlGetCustomersByEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log("Initiated");

    try {
      const body = await request.json();
      const customerEmail = body?.customerEmail;

      if (!customerEmail) {
        return {
          status: 400,
          jsonBody: {
            message:
              'customerEmail is required in body. Example: { "customerEmail": "demoCustomer44@yuopmail.com" }',
          },
        };
      }

      const customerWhere = `email="${customerEmail}"`;
      const cartsWhere = `customerEmail="${customerEmail}"`;
      const ordersWhere = `customerEmail="${customerEmail}"`;

      const graphQlQuery = {
        query: `
          query (
            $customerWhere: String!
            $cartsWhere: String!
            $ordersWhere: String!
          ) {
            customers(where: $customerWhere, limit: 1) {
              results {
                email
                firstName
                lastName
                addresses {
                  firstName
                  lastName
                  phone
                  title
                  streetNumber
                  streetName
                  salutation
                  region
                  postalCode
                }
              }
            }

            carts(where: $cartsWhere, limit: 10) {
              results {
                id
                totalPrice {
                  centAmount
                  currencyCode
                }
                lineItems {
                  name(locale: "en")    # 👈 locale added
                  quantity
                  price {
                    value {
                      centAmount
                      currencyCode
                    }
                  }
                }
              }
            }

            orders(where: $ordersWhere, limit: 10) {
              results {
                id
                orderNumber
                totalPrice {
                  centAmount
                  currencyCode
                }
                lineItems {
                  name(locale: "en")    # 👈 locale added
                  quantity
                }
              }
            }
          }
        `,
        variables: {
          customerWhere,
          cartsWhere,
          ordersWhere,
        },
      };

      const response = await apiRoot
        .graphql()
        .post({ body: graphQlQuery })
        .execute();

      if (response.body.errors) {
        context.log("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
        return {
          status: 500,
          jsonBody: {
            message: "GraphQL query failed",
            errors: response.body.errors,
          },
        };
      }

      const data = response.body.data;
      const customer = data.customers?.results?.[0] || null;
      const carts = data.carts?.results || [];
      const orders = data.orders?.results || [];

      if (!customer) {
        return {
          status: 404,
          jsonBody: {
            message: `No customer found with email: ${customerEmail}`,
          },
        };
      }

      return {
        status: 200,
        jsonBody: {
          customer,
          carts,
          orders,
        },
      };
    } catch (error) {
      context.log("Unexpected error:", error);
      return {
        status: 500,
        jsonBody: {
          message: "Failed",
          error: error.message,
        },
      };
    }
  },
});