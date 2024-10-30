import { Hono } from "hono";
import { fetchCompaniesHandler } from "../../handlers/companies";
import { cacheMiddleware } from "../../middleware/cache";

const companiesRoute = new Hono();

companiesRoute.use("/companies", cacheMiddleware("/companies"));
companiesRoute.get("/companies", fetchCompaniesHandler);

export default companiesRoute;
