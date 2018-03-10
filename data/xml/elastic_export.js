const es = require('elasticsearch');
const client = new es.Client({
    host: 'localhost:9200',
    // log: 'trace'
});

async function delete_index(name) {
    try {
        console.log('Deleting ' + name + ' index...');
        client.indices.delete({
            index: name,
        });
    }
    catch (error) {
        console.log('Error deleting SDN index: ' + error);
    }
}

function construct_body(operations, transform, index_name, index_type) {
    let body = [];
    for (var i = 0; i < operations.length; i++) {
        let es_index_statement = {
            index: {
                _index: index_name,
                _type: index_type,
                _id: i
            }
        };
        body.push(es_index_statement);
        body.push(transform(op));
    }
    return body;
}

async function bulk_add(operations, index_name, index_type) {
    let body = construct_body(operations, index_name, index_type);

    let errors = 0

    try {
        console.log('Bulk loading...')
        const result = await client.bulk({
            body: body
        });

        result.items.forEach(i => {
            if (i.index.error) {
                console.log(JSON.stringify(i));
            }
        })

        return result;
    }
    catch (error) {
        console.log(error);
    }
}

async function create_index(name) {
    console.log('Creating ' + name + ' index...');
    await client.indices.create({
        index: name
    });
}

async function reload_index(operations, transform, index_name, index_type) {
    try {
        await delete_index(index_name);
        await create_index(index_name);
        await bulk_add(operations, transform, index_name, index_type);
    } catch (error) {
        console.log('ERROR: ' + error);
    }

}

module.exports = {
    reload_index: reload_index,
    // can add other connector functions in the future if necessary
}
