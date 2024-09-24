import { Hono } from "hono";
import { fetchCompaniesHandler } from "../../handlers/companies";

const companiesRoute = new Hono();

companiesRoute.get("/companies", fetchCompaniesHandler);

export default companiesRoute;
