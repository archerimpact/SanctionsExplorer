$(document).ready(() => {
    let faq = doT.template($('#faq-card-template').html());
    let data = [
        {
            id: 'removed',
            question: 'Can I search for an individual who was delisted/unsanctioned?',
            answer: '<p>Delisted individuals do NOT show up in the regular search results.  However, oftentimes they can be found by searching their name or other indentifying information using the press release search, since the Treasury will have published a notification of their listing/delisting.</p>',
        },
        {
            id: 'update-frequency',
            question: 'How often is the information updated?',
            answer: '<p>Within five minutes of the Treasury publishing a press release (<a href="https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/OFAC-Recent-Actions.aspx" target="_blank">here</a>), the data should be available in SanctionsExplorer.</p>',
        },
        {
            id: 'nonsdn',
            question: 'Which OFAC sanctions lists are searchable through SanctionsExplorer?',
            answer: '<p>Both the SDN list and the consolidated non-SDN list are available (the latter of which contains the SSI, FSE, NS-PLC, and more).  For information on which non-SDN lists are included, please go <a href="https://www.treasury.gov/resource-center/sanctions/SDN-List/Pages/consolidated.aspx" target="_blank">here</a>.</p>',
        },
        {
            id: 'fuzzy',
            question: 'What are "Near Matches"?',
            answer: '<p>Near Matches are words that are only a few characters different than the search query.  For example, the words "Hong" and "Hone" only differ by one letter.  Matches are sorted by relevance and get more inexact the further you scroll.</p>',
        },
        {
            id: 'effective',
            question: 'How do I most effectively search?',
            answer: '<p>If no results are being returned, try removing some words from your query or removing an entire filter.</p><p>At this time, we do not have boolean searching (i.e. you cannot query for "Russia OR Ukraine"). If you think this feature would be useful to you, please let us know by submitting feedback.</p>',
        },
        {
            id: 'disclaimer',
            question: 'Are you affiliated with the Treasury? Can I use this for compliance?',
            answer: '<p>SanctionsExplorer, Archer, and C4ADS are neither affiliated with nor endorsed by the U.S. Department of Treasury or OFAC.  Additionally, SanctionsExplorer, Archer, and C4ADS make no guarantee on the accuracy of the data contained in the SanctionsExplorer platform or any released datasets (though we do our absolute best to confidentally ensure accuracy). SanctionsExplorer is not a replacement for due diligence and we recommend verifying information with the OFAC website or datasets.</p>',
        }
    ];

    for (var i in data) {
        $('.faq-list').append(faq(data[i]));
    }

});
