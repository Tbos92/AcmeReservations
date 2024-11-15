require("dotenv").config();

const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  fetchCustomers,
  fetchRestaurants,
  createReservation,
  fetchReservations,
  destroyReservation,
} = require("./db");

const express = require("express");
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

// READ customers using GET /api/customers
app.get("/api/customers", async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (error) {
    next(error);
  }
});

// READ restaurants using GET /api/restaurants
app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (error) {
    next(error);
  }
});

// READ reservations using GET /api/reservations
app.get("/api/reservations", async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (error) {
    next(error);
  }
});

// REMOVE specific reservation using DELETE /api/customers/:customer_id/reservations/:id
app.delete(
  "/api/customers/:customer_id/reservations/:id",
  async (req, res, next) => {
    try {
      await destroyReservation({
        customer_id: req.params.customer_id,
        id: req.params.id,
      });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/customers/:customer_id/reservations - Returns a created reservation with a customer and restaurant
app.post("/api/customers/:customer_id/reservations", async (req, res, next) => {
  try {
    res.status(201).send(
      await createReservation({
        customer_id: req.params.customer_id,
        restaurant_id: req.body.restaurant_id,
        party_count: req.body.party_count,
        date: req.body.date,
      })
    );
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  await createTables();

  const [
    alice,
    brian,
    catherine,
    david,
    evelyn,
    goldenSpoon,
    urbanBistro,
    seasideGrill,
  ] = await Promise.all([
    createCustomer({ name: "Alice Johnson" }),
    createCustomer({ name: "Brian Smith" }),
    createCustomer({ name: "Catherine Lee" }),
    createCustomer({ name: "David Kim" }),
    createCustomer({ name: "Evelyn Martinez" }),
    createRestaurant({ name: "The Golden Spoon" }),
    createRestaurant({ name: "Urban Bistro" }),
    createRestaurant({ name: "Seaside Grill" }),
  ]);
  console.log(await fetchCustomers());
  console.log(await fetchRestaurants());

  const [reservation, reservation2] = await Promise.all([
    createReservation({
      customer_id: alice.id,
      restaurant_id: goldenSpoon.id,
      party_count: 6,
      date: "2025-02-14",
    }),
    createReservation({
      customer_id: david.id,
      restaurant_id: seasideGrill.id,
      party_count: 2,
      date: "2025-02-28",
    }),
  ]);
  console.log(await fetchReservations());

//   await destroyReservation({
//     id: reservation.id,
//     customer_id: reservation.customer_id,
//   });
//   console.log(await fetchReservations());

  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);

    console.log(`curl localhost:${port}/api/customers`);
    console.log(`curl localhost:${port}/api/restaurants`);
    console.log(`curl localhost:${port}/api/reservations`);
    console.log(
      `curl -X DELETE localhost:${port}/api/customers/${alice.id}/reservations/${reservation2.id}`
    );
    console.log(
      `curl -X POST localhost:${port}/api/customers/${alice.id}/reservations -d '{"restaurant_id":"${urbanBistro.id}", "party_count": 4, "date": "2025-02-15"}' -H "Content-Type:application/json"`
    );
  });
};
init();
