function getGatewayToken(req,env=process.env){
 const header=req?.headers?.["x-vercel-oidc-token"];
 return env.AI_GATEWAY_API_KEY||env.VERCEL_OIDC_TOKEN||(typeof header==="string"?header:"");
}
module.exports={getGatewayToken};
