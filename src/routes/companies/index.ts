import { Hono } from "hono";
import { fetchAllCompaniesHandler, fetchCompaniesHandler } from "../../handlers/companies";

const companiesRoute = new Hono();

companiesRoute.get("/companies", fetchCompaniesHandler);
companiesRoute.get("/all_companies", fetchAllCompaniesHandler);

export default companiesRoute;
