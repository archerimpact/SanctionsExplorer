def write_json(outfile, data):
    with open(outfile, 'w') as f:
        f.write(json.dumps(data))
        f.close()
    return True


def read_json(outfile):
    ret = None
    with open(outfile, 'r') as f:
        json.load(f)
        f.close()
    return ret


def log(owner):
    def f(msg, level):
        print(f'<{owner}> {level.upper()}: {msg}.')
    return f
