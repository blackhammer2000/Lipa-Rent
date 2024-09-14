const { Schema, model } = require("mongoose");

const TenantSchema = new Schema({
  landlordID: {
    type: String,
    required: true,
  },

  tenants: {
    type: Object,
    required: true,
  },
});

const Tenant = model("tenant", TenantSchema);

module.exports = { Tenant };
