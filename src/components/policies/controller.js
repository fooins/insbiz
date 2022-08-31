class PolicyController {
  static async bound(ctx) {
    ctx.status = 200;
    ctx.body = {
      policyNo: `P${Date.now()}`,
    };
  }
}

module.exports = PolicyController;
