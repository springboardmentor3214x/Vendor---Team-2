"""add granular vendor performance metrics (delivery/quality/communication/service)

Revision ID: 0002_performance_ext
Revises: 0001_vendor_ext
Create Date: 2026-08-17
"""
from alembic import op
import sqlalchemy as sa


revision = "0002_performance_ext"
down_revision = "0001_vendor_ext"
branch_labels = None
depends_on = None


NEW_COLUMNS = [
    ("expected_delivery_date", sa.Date()),
    ("actual_delivery_date", sa.Date()),
    ("delivery_remarks", sa.String(500)),
    ("material_quality", sa.Float()),
    ("packaging_quality", sa.Float()),
    ("quantity_accuracy", sa.Float()),
    ("specification_compliance", sa.Float()),
    ("product_defects", sa.String(500)),
    ("quality_remarks", sa.String(500)),
    ("message_sent_time", sa.DateTime(timezone=True)),
    ("vendor_response_time", sa.DateTime(timezone=True)),
    ("communication_status", sa.String(30)),
    ("communication_remarks", sa.String(500)),
    ("professionalism", sa.Float()),
    ("customer_support", sa.Float()),
    ("documentation_quality", sa.Float()),
    ("flexibility", sa.Float()),
    ("communication_effectiveness", sa.Float()),
    ("issue_resolution", sa.Float()),
    ("service_comments", sa.String(500)),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "vendor_performance" not in inspector.get_table_names():
        return  # table is created fresh by create_all/models on a brand-new DB
    existing_columns = {c["name"] for c in inspector.get_columns("vendor_performance")}
    with op.batch_alter_table("vendor_performance") as batch_op:
        for name, col_type in NEW_COLUMNS:
            if name not in existing_columns:
                batch_op.add_column(sa.Column(name, col_type, nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("vendor_performance") as batch_op:
        for name, _ in NEW_COLUMNS:
            batch_op.drop_column(name)
