import json
import rollbar
import credentials
rollbar.init(credentials.rollbar)

def write_json(outfile, data):
    with open(outfile, 'w') as f:
        f.write(json.dumps(data))
        f.close()
    return True


def read_json(outfile):
    ret = None
    with open(outfile, 'r') as f:
        ret = json.load(f)
        f.close()
    return ret


def log(owner):
    owner_tag = f'<{owner}>'
    def f(msg, level):
        rollbar.report_message(msg, level.lower())
        print(f'{owner_tag:<14}{level.upper()}: {msg}.')
    return f

def exception_thrown():
    rollbar.report_exc_info()
