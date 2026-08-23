import random
import string
from datetime import datetime


def _suffix(n: int = 5) -> str:
    return "".join(random.choices(string.digits, k=n))


def generate_request_code() -> str:
    return f"PR-{datetime.utcnow().strftime('%Y%m')}-{_suffix()}"


def generate_po_number() -> str:
    return f"PO-{datetime.utcnow().strftime('%Y%m')}-{_suffix()}"


def generate_contract_number() -> str:
    return f"CT-{datetime.utcnow().strftime('%Y%m')}-{_suffix()}"
