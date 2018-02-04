$(document).ready(() => {
	let card = doT.template(document.getElementById('card-template').innerHTML);

	$('.right-col').append(card({id: '1', name: 'BIN LADEN, Osama'}));
	$('.right-col').append(card({id: '2', name: 'MA, Alice'}));

	let searchRow = doT.template(document.getElementById('search-row-template').innerHTML);
	var id = 0;

	fields = ['Type', 'DOB', 'POB'];
	$('.search-form').append(searchRow({'id': id++, 'fields': fields}));

	$('.search-button').click((event) => {
		event.preventDefault();
		console.log(get_query_info());
	});

	$(document).on('change', '.search-row-select', event => {
		console.log("Event fired!");

		var needNewRow = true;
		$.each($('.search-row-select'), (index, value) => {
			if (value.value == 'Select field') {
				console.log('Dont need new');
				needNewRow = false;
				return false;
			}
		});

		if (needNewRow) {
			$('.search-form').append(searchRow({'id': id++, 'fields': fields}));
		}
	});
});

function get_query_info() {
	let data = [];

	var i = 0;
	while ($('#search-row-' + i)[0] != null) {
		let select = $('#search-row-' + i + '-select').val();
		let input = $('#search-row-' + i + '-input').val();
		if (select != 'Select field') {
			data.push({option: select, value: input});
		}
		i++;
	}
	return data;
}
