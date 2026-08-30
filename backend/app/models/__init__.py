# Import all ORM models so that Base.metadata is fully populated.
# Alembic env.py uses this module to discover all tables automatically.
from app.models.user import User, UserRole            # noqa: F401
from app.models.vendor import Vendor, VendorDocument  # noqa: F401
from app.models.procurement import (                  # noqa: F401
    ProcurementRequest,
    ProcurementApproval,
    PurchaseOrder,
    ProcurementStatusHistory,
    OrderTracking,
    Invoice,
)
