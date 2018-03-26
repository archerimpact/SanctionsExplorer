$(document).ready(() => {
	let faq = doT.template($('#faq-card-template').html());
	let data = [
		{
			id: 'removed',
			question: 'Can I search for an individual who was delisted/unsanctioned?',
			answer: '<p>Oftentimes, this can be accomplished by searching their name or other indentifying information using the press release search, since the Treasury will have published a notification of this.</p>',
		},
		{
			id: 'nonsdn',
			question: 'Which OFAC sanctions lists are searchable through SanctionsExplorer?',
			answer: '<p>The SDN list as well as the consolidated non-SDN list are available (the latter of which contains the SSI, FSE, NS-PLC, and more).  For information on which non-SDN lsits are included, please go <a href="https://www.treasury.gov/resource-center/sanctions/SDN-List/Pages/consolidated.aspx" target="_blank">here</a>.</p>',
		},
		{
			id: 'fuzzy',
			question: 'What are "Near Matches"?',
			answer: '<p>Near Matches are words that are only a few characters different than the search query.  For example, the words "Hong" and "Hone" only differ by one letter.  Matches are sorted by relevance and get more inexact the further you scroll.</p>',
		},
		{
			id: 'effective',
			question: 'How do I most effectively search?',
			answer: '<p>If no results are being returned, try removing some words from your query or removing an entire filter.</p><p>At this time, we do not have boolean searching (i.e. you cannot query for "Russia OR Ukraine").</p>',
		},
		{
			id: 'disclaimer',
			question: 'Are you affiliated with the Treasury? Can I use this for compliance?',
			answer: '<p>SanctionsExplorer, Archer, and C4ADS are neither affiliated with nor endorsed by the U.S. Department of Treasury or OFAC.  Additionally, SanctionsExplorer, Archer, and C4ADS make no guarantee on the accuracy of the data contained in the SanctionsExplorer platform or any released datasets (though we do our best to confidentally ensure that no data is missing). SanctionsExplorer is not a replacement for due diligence and we recommend verifying information with the OFAC website or datasets.</p>',
		}
	];

	for (var i in data) {
		$('.faq-list').append(faq(data[i]));
	}
});
