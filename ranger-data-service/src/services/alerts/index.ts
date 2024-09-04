export async function fetchAlerts() {
	return [
		{ type: "Missing Pet", location: "NYC", details: "Lost cat in Brooklyn" },
		{ type: "Road Closure", location: "LA", details: "Main St. closed due to construction" },
	];
}
