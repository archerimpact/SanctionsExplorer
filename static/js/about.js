$(document).ready(() => {
	let faq = doT.template($('#faq-card-template').html());
	let data = [
		{
			id: 'removed',
			question: 'How do I search for an individual who was removed from the SDN list?',
			answer: '<p>Search their name or other indentifying information in the press release search.</p><p>Searching removed individuals through the main SDN search coming soon!</p>',
		},
		{
			id: 'fuzzy',
			question: 'How do I do fuzzy search/inexact matching?',
			answer: '<p>By default, the SDN search performs fuzzy/inexact matching.  If you notice that halfway down the page, results are no longer relevant, then you can safely stop viewing more results since they are ordered by relevance.</p>' +
                    '<p>We have not yet added fuzzy searching of press releases, but this is coming soon!</p>',
		},
		{
			id: 'effective',
			question: 'How do I most effectively search?',
			answer: '<p>If no results are being returned, try removing some words from your query or removing an entire filter.</p>',
		},
		{
			id: 'disclaimer',
			question: 'Are you affiliated with the Treasury? Can I use this for compliance?',
			answer: '<p>Archer SDN, Archer, and C4ADS are not affiliated with nor endorsed by the U.S. Department of Treasury.  Additionally, Archer SDN, Archer, and C4ADS make no guarantee on the accuracy of the data contained in the Archer SDN platform -- although we do our best to ensure that no data is missing, we do not recommend using Archer SDN for compliance (at least, not without verifying using the official Treasury website).</p>',
		}
	];

	for (var i in data) {
		$('.faq-list').append(faq(data[i]));
	}
});
