// fallow-ignore-file unused-file -- Node's test runner discovers this file.
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/User");
const Product = require("../models/Product");
const users = require("../controllers/user");
const products = require("../controllers/product");

let database;
let seller;
let buyer;
let product;
const invoke = async (handler, user, body) => {
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ user: { id: String(user._id) }, body }, res);
  return res;
};
test.before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  [seller, buyer] = await User.create([
    { firstname: "Public", lastname: "Seller", email: "seller@nita.ac.in", hashedpassword: "fixture-hash" },
    { firstname: "Campus", lastname: "Buyer", email: "buyer@nita.ac.in", hashedpassword: "fixture-hash" },
  ]);
  product = await Product.create({ productname: "Desk lamp", productdescription: "Study lamp", price: 500, images: ["https://example.test/lamp.jpg"], owner: seller._id });
});
test.after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });

test("name visibility is opt-in, applies to marketplace responses, and can be revoked", async () => {
  assert.equal(seller.nameVisibility, "private");
  // Old accounts with no preference must also remain private.
  await User.collection.updateOne({ _id: seller._id }, { $unset: { nameVisibility: "" } });
  const assertMarketplace = async (expected) => {
    const detail = await invoke(products.getproductpagedetails, buyer, { productid: String(product._id) });
    const list = await invoke(products.getallproduct, buyer, {});
    assert.equal(detail.body.success, true);
    assert.equal(list.body.success, true);
    for (const owner of [detail.body.data.owner, list.body.data.products[0].owner]) {
      assert.equal(owner.nameVisibility, expected);
      assert.equal(String(owner._id), String(seller._id));
      assert.equal(owner.firstname, expected === "public" ? "Public" : undefined);
      assert.equal(owner.lastname, expected === "public" ? "Seller" : undefined);
      for (const field of ["email", "hashedpassword", "additionaldetails", "image"]) assert.equal(owner[field], undefined);
      assert.equal(owner.sellerReputation.count, 0);
    }
  };
  await assertMarketplace("private");
  const saved = await invoke(users.updateuser, seller, { nameVisibility: "public", id: String(buyer._id) });
  assert.equal(saved.body.success, true);
  assert.equal(saved.body.data.nameVisibility, "public");
  assert.equal((await User.findById(buyer._id)).nameVisibility, "private", "Only the authenticated account can change its preference");
  await assertMarketplace("public");
  await invoke(users.updateuser, seller, { firstname: "Public" });
  await assertMarketplace("public");
  for (const value of ["PUBLIC", "", null, true, { $ne: "private" }]) {
    const rejected = await invoke(users.updateuser, seller, { nameVisibility: value });
    assert.equal(rejected.statusCode, 400);
  }
  await assertMarketplace("public");
  assert.equal((await invoke(users.updateuser, seller, { nameVisibility: "private" })).body.success, true);
  await assertMarketplace("private");
});
