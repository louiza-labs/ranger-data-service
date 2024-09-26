import { events, LinkedinScraper, onSiteOrRemoteFilter, timeFilter, typeFilter } from "linkedin-jobs-scraper";

export const runJobScraper = async ({
	position,
	location,
	offset,
}: {
	position: string;
	location: string;
	offset?: number;
}) => {
	// Initialize the scraper instance
	const scraper = new LinkedinScraper({
		headless: true,
		slowMo: 300,
		timeout: 300000,
	});

	const jobs: Array<any> = [];

	// Add listeners for scraper events

	// Emitted once for each processed job
	scraper.on(events.scraper.data, (data) => {
		jobs.push({
			location: data.location,
			id: data.jobId,
			title: data.title,
			company: data.company || "N/A",
			companyLink: data.companyLink || "N/A",
			companyImgLink: data.companyImgLink || "N/A",
			place: data.place,
			date: data.date,
			link: data.link,
			applyLink: data.applyLink || "N/A",
		});
	});

	// Emitted once for each scraped page
	scraper.on(events.scraper.metrics, (metrics) => {
		console.log(`Processed=${metrics.processed}, Failed=${metrics.failed}, Missed=${metrics.missed}`);
	});

	// Error handling
	scraper.on(events.scraper.error, (err) => {
		console.error(err);
	});

	// When the scraper ends
	scraper.on(events.scraper.end, () => {
		console.log("All done!");
	});

	// Custom function executed on the browser side to extract job description [optional]
	const descriptionFn = () => {
		const description = document.querySelector<HTMLElement>(".jobs-description");
		return description ? description.innerText.replace(/[\s\n\r]+/g, " ").trim() : "N/A";
	};

	// Run queries concurrently
	await scraper.run([
		{
			query: position ?? "Product Manager",
			options: {
				pageOffset: offset ?? 2,
				locations: [location ?? "New York"],
				filters: {
					type: [typeFilter.FULL_TIME],
					time: timeFilter.WEEK,

					onSiteOrRemote: [onSiteOrRemoteFilter.ON_SITE, onSiteOrRemoteFilter.REMOTE, onSiteOrRemoteFilter.HYBRID],
					// baseSalary: baseSalaryFilter.SALARY_100K,
				},
				limit: 100,
			},
		},
	]);

	// Close the browser
	await scraper.close();

	// Return the accumulated job data
	return jobs;
};
