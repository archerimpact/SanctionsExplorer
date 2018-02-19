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
			answer: '<p>You can\'t right now lmao</p>',
		},
		{
			id: 'effective',
			question: 'How do I most effectively search?',
			answer: '<p>If no results are being returned, try removing some words from your query.</p>',
		},
		{
			id: 'disclaimer',
			question: 'Are you affiliated with the Treasury? Can I use this for compliance?',
			answer: '<p>OFACasaurus, Archer, and C4ADS are not affiliated with the U.S. Department of Treasury, which does not endorse OFACasaurus.  Additionally, OFACasaurus, Archer, and C4ADS make no guarantee on the accuracy of the data contained in the OFACasaurus platform -- although we do our best to ensure that no data is missing, we do not recommend using OFACasaurus for compliance (at least, not without verifying using the official Treasury website).</p>',
		}
	];

	for (var i in data) {
		$('.faq-list').append(faq(data[i]));
	}
});
