"""add invoice_due_date and payment_status to purchase_orders

Revision ID: 0003_po_ext
Revises: 0002_performance_ext
Create Date: 2026-08-17
"""
from alembic import op
import sqlalchemy as sa


revision = "0003_po_ext"
down_revision = "0002_performance_ext"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "purchase_orders" not in inspector.get_table_names():
        return
    existing_columns = {c["name"] for c in inspector.get_columns("purchase_orders")}
    with op.batch_alter_table("purchase_orders") as batch_op:
        if "invoice_due_date" not in existing_columns:
            batch_op.add_column(sa.Column("invoice_due_date", sa.Date(), nullable=True))
        if "payment_status" not in existing_columns:
            batch_op.add_column(sa.Column("payment_status", sa.String(20), nullable=False, server_default="Unpaid"))


def downgrade() -> None:
    with op.batch_alter_table("purchase_orders") as batch_op:
        batch_op.drop_column("payment_status")
        batch_op.drop_column("invoice_due_date")
