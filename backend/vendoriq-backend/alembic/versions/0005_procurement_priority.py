"""add priority to procurement_requests

Revision ID: 0005_procurement_priority
Revises: 0004_status_history
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa


revision = "0005_procurement_priority"
down_revision = "0004_status_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "procurement_requests" not in inspector.get_table_names():
        return
    existing_columns = {c["name"] for c in inspector.get_columns("procurement_requests")}
    if "priority" not in existing_columns:
        with op.batch_alter_table("procurement_requests") as batch_op:
            batch_op.add_column(sa.Column("priority", sa.String(20), nullable=False, server_default="MEDIUM"))


def downgrade() -> None:
    with op.batch_alter_table("procurement_requests") as batch_op:
        batch_op.drop_column("priority")
