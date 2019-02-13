import json
import sentry_sdk
import logging
import credentials

sentry_sdk.init(credentials.sentry)


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

    logger = logging.getLogger(owner_tag)
    logger.setLevel(logging.INFO)

    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)

    formatter = logging.Formatter('%(name)-13s %(levelname)s: %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    levels = {
        'critical': logger.critical,
        'error': logger.error,
        'warning': logger.warning,
        'info': logger.info,
        'debug': logger.debug
    }

    def f(msg, level):
        # levels[level](f'{owner_tag:<14}{level.upper()}: {msg}')
        levels[level](msg)

    return f


def exception_thrown():
    logging.error('An error occurred!', exc_info=True)
